"""Weekly market card, Instagram.
SAFE ZONES (measured 2026-09-03 from a live Story): Instagram header covers the top 14 percent, so the first element sits at 16 percent (y 310 on 1920). Link sticker lands near 80 percent, so the plate keeps the bottom 17 percent as empty lawn. Rebuilt 2026-09-03 from 02-playbooks_weekly-market-card-instagram.md.
Usage: python3 weekly_market_card.py reel|feed plate.png out.jpg
"""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

GOLD=(201,169,106); IVORY=(247,243,236); GREY=(138,131,120); CHAR=(27,27,27)
F=dict(play='fonts/PlayfairDisplay.ttf', sans='fonts/Inter.ttf')

FMT={
 'reel_low': dict(W=1080,H=1920,FX0=140,FX1=940,GRID_END=0.75,PITCH=148,CELL=124,HANDLE_Y=310,
              KICK_Y=356,LOCK=62,HEAD=34,FIG=46,LAB=22,CHG=25,PER=30,KICK=26),
 'reel': dict(W=1080,H=1920,FX0=140,FX1=940,GRID_END=0.79,PITCH=186,CELL=154,HANDLE_Y=310,
              KICK_Y=360,LOCK=88,HEAD=50,FIG=62,LAB=24,CHG=27,PER=32,KICK=28),
 'feed': dict(W=1080,H=1350,FX0=110,FX1=970,GRID_END=0.85,PITCH=150,CELL=124,HANDLE_Y=60,
              KICK_Y=120,LOCK=76,HEAD=42,FIG=52,LAB=21,CHG=24,PER=28,KICK=25),
}

KICKER="BUYER'S MARKET  \u00b7  8.1 MONTHS OF INVENTORY"
PERIOD="Week of August 24 to 30, 2026"
HEADLINE=["Fewer homes sold.","The average price rose $40,000.","Here is what actually moved."]
STATS=[("SALES","149","down","15.8%"),("AVERAGE PRICE","$743,427","up","5.8%"),
       ("NEW LISTINGS","419","down","42"),("ACTIVE LISTINGS","5,419","down","51"),
       ("SALES TO NEW LISTINGS","36%","down","2 pts"),("MONTHS OF INVENTORY","8.1","down","0.1"),
       ("DAYS ON MARKET","48","up","9 days"),("LIST TO SALE","96%","down","1 pt")]
HANDLE="@JONATHANWALLACEREALESTATE"

def font(path,size,weight=None):
    f=ImageFont.truetype(path,size)
    if weight:
        try: f.set_variation_by_name(weight)
        except Exception: pass
    return f

def spaced_width(d,text,f,ls):
    return sum(d.textlength(c,font=f) for c in text)+ls*(len(text)-1)

def draw_spaced(d,cx,y,text,f,fill,ls):
    w=spaced_width(d,text,f,ls); x=cx-w/2
    for c in text:
        d.text((x,y),c,font=f,fill=fill); x+=d.textlength(c,font=f)+ls
    return w

def scrim(plate, boxes, strength):
    """2D adaptive scrim: darken bright regions under the given text boxes using a blurred luminance map."""
    W,H=plate.size
    lum=np.array(plate.convert('L').filter(ImageFilter.GaussianBlur(60))).astype(float)/255.0
    mask=np.zeros((H,W),float)
    for (x0,y0,x1,y1) in boxes:
        pad=70
        m=np.zeros((H,W),float); m[max(0,y0-pad):min(H,y1+pad), max(0,x0-pad):min(W,x1+pad)]=1
        mask=np.maximum(mask,m)
    mask=np.array(Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.GaussianBlur(45))).astype(float)/255.0
    alpha=np.clip((lum-0.30)*strength,0,0.32)*mask
    a=(alpha*255).astype('uint8')
    dark=Image.new('RGB',(W,H),CHAR)
    return Image.composite(dark,plate,Image.fromarray(a))

def build(fmt, plate_path, out):
    C=FMT[fmt]; W,H=C['W'],C['H']
    FCX=W//2; assert FCX==(C['FX0']+C['FX1'])//2, 'field must centre on frame'
    plate=Image.open(plate_path).convert('RGB')
    pw,ph=plate.size
    s=max(W/pw,H/ph); plate=plate.resize((round(pw*s),round(ph*s)),Image.LANCZOS)
    plate=plate.crop(((plate.width-W)//2,(plate.height-H)//2,(plate.width-W)//2+W,(plate.height-H)//2+H))

    kick=font(F['sans'],C['KICK'],'SemiBold'); lock=font(F['play'],C['LOCK'],'SemiBold')
    head=font(F['play'],C['HEAD'],'Regular'); per=font(F['sans'],C['PER'],'Regular')
    fig=font(F['play'],C['FIG'],'SemiBold'); lab=font(F['sans'],C['LAB'],'SemiBold')
    chg=font(F['sans'],C['CHG'],'Medium'); hand=font(F['play'],int(C['KICK']*1.25),'Regular')

    # --- solve vertical layout: grid end is locked; everything above must fit
    grid_end=round(H*C['GRID_END'])
    grid_top=grid_end-4*C['PITCH']
    # header block heights
    y=C['KICK_Y']
    kick_h=C['KICK']+8
    lock_h=2*int(C['LOCK']*1.12)
    rule_gap=26; per_h=C['PER']+6
    head_size=C['HEAD']
    while True:
        head_h=3*int(head_size*1.3)
        header_end=y+kick_h+18+lock_h+rule_gap+3+rule_gap+per_h
        need=header_end+40+head_h+56
        if need<=grid_top or head_size<=36: break
        head_size-=2
    head=font(F['play'],head_size,'Regular')
    head_h=3*int(head_size*1.3)
    total=kick_h+18+lock_h+rule_gap+3+rule_gap+per_h+40+head_h
    slack=grid_top-C['KICK_Y']-total-40
    gap=max(0,slack//4)  # distribute extra space

    # text boxes for the scrim
    boxes=[(C['FX0'],C['KICK_Y']-20,C['FX1'],grid_top+4*C['PITCH']+30)]
    # even darkening of the whole plate, no local gradient
    arr0=np.array(plate).astype(float); arr0=arr0*0.62+np.array(CHAR)*0.10; img=Image.fromarray(np.clip(arr0,0,255).astype('uint8'))
    # bottom scrim, DEC-160 strengthened
    W_,H_=img.size; arr=np.array(img).astype(float)
    t=np.linspace(0,1,H_)[:,None,None]; ramp=np.clip((t-0.55)/0.45,0,1)**2.6*0
    arr=np.clip(arr-ramp,0,255); img=Image.fromarray(arr.astype('uint8'))
    d=ImageDraw.Draw(img)

    d.text((FCX,C['HANDLE_Y']),HANDLE,font=hand,fill=IVORY,anchor='mm')
    y=C['KICK_Y']
    draw_spaced(d,FCX,y,KICKER,kick,GOLD,C['KICK']*0.18); y+=kick_h+18+gap
    for line in ["GEORGIAN BAY","MARKET UPDATE"]:
        draw_spaced(d,FCX,y,line,lock,IVORY,C['LOCK']*0.16); y+=int(C['LOCK']*1.12)
    y+=rule_gap; d.rectangle((FCX-60,y,FCX+60,y+3),fill=GOLD); y+=3+rule_gap+gap
    d.text((FCX,y),PERIOD,font=per,fill=IVORY,anchor='ma'); y+=per_h+40+gap
    for line in HEADLINE:
        assert d.textlength(line,font=head)<=C['FX1']-C['FX0'], f'headline line too long: {line}'
        d.text((FCX,y),line,font=head,fill=IVORY,anchor='ma'); y+=int(head_size*1.3)
    assert y+30<=grid_top, f'header overruns grid top by {y+30-grid_top}px'

    # --- grid 2x4
    colw=(C['FX1']-C['FX0'])//2
    cx=[C['FX0']+colw//2, C['FX0']+colw+colw//2]
    d.line((FCX,grid_top+10,FCX,grid_end-10),fill=(160,152,138),width=1)
    for i,(label,value,dirn,delta) in enumerate(STATS):
        r,c=divmod(i,2); top=grid_top+r*C['PITCH']; x=cx[c]
        # each stat is one unit: label, figure, change
        yy=top
        d.text((x,yy),label,font=lab,fill=GREY,anchor='ma')  # auto-fit
        if d.textlength(label,font=lab)>colw-30:
            lab2=font(F['sans'],C['LAB']-3,'SemiBold'); d.rectangle((x-colw//2,yy,x+colw//2,yy+C['LAB']+6),fill=None)
        yy+=C['LAB']+14
        d.text((x,yy),value,font=fig,fill=IVORY,anchor='ma'); yy+=int(C['FIG']*1.15)+6
        col=GOLD if dirn=='up' else GREY
        tw=d.textlength(delta,font=chg); tri=14; gapx=10; gw=tri+gapx+tw; x0=x-gw/2
        ty=yy+C['CHG']//2
        if dirn=='up': d.polygon([(x0,ty+tri/2),(x0+tri,ty+tri/2),(x0+tri/2,ty-tri/2)],fill=col)
        else: d.polygon([(x0,ty-tri/2),(x0+tri,ty-tri/2),(x0+tri/2,ty+tri/2)],fill=col)
        d.text((x0+tri+gapx,yy),delta,font=chg,fill=col,anchor='la')
        # hairline inside the trough, never through figures
        if r<3:
            ly=top+C['CELL']+(C['PITCH']-C['CELL'])//2
            d.line((x-colw//2+20,ly,x+colw//2-20,ly),fill=(160,152,138),width=1)
    # closing gold rule and handle
    d.rectangle((FCX-60,grid_end+34,FCX+60,grid_end+37),fill=GOLD)
    img.save(out,quality=90,progressive=True,optimize=True)
    print(fmt,'grid ends at',round(grid_end/H*100,2),'% head size',head_size,'->',out)

if __name__=='__main__':
    build(sys.argv[1],sys.argv[2],sys.argv[3])
