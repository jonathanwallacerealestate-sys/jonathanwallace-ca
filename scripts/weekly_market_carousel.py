"""APPROVED weekly market Instagram carousel (8 slides, 1080 x 1350), locked 2026-11-25 (DEC-20261125-04).
Usage: python3 scripts/weekly_market_carousel.py OUT_DIR
Each week edit ONLY the values in the slide blocks below (week range, numbers, changes, notes, trend values,
gauge angle, slide 2 and slide 8 sentences). Do not change sizes, spacing, header or badge.
The script renders every slide and runs the text-overlap check; it must print `carousel_check: OK`.
Reference: assets/img/social/market-update-nov-16-22-2026/ig-carousel-[1-8].jpg
Fonts: /home/claude/fonts/PlayfairDisplay.ttf and NunitoSans.ttf. Chrome at /usr/bin/google-chrome.
"""
import base64, math
F='/home/claude/fonts/'
import os, sys
REPO=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=sys.argv[1] if len(sys.argv)>1 else '.'
os.makedirs(OUT, exist_ok=True)
hdr=base64.b64encode(open(os.path.join(REPO,'assets/img/social/carousel-header.png'),'rb').read()).decode()
CSS=f"""
@font-face{{font-family:PF;src:url('file://{F}PlayfairDisplay.ttf');font-weight:400 900}}
@font-face{{font-family:NS;src:url('file://{F}NunitoSans.ttf');font-weight:200 1000}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1350px;background:#F5F0EA;font-family:NS;color:#1E1E1E;position:relative;overflow:hidden;font-variant-numeric:lining-nums}}
.hdr{{position:absolute;left:60px;top:70px;width:740px;height:210px;background:url(data:image/png;base64,{hdr})}}
.pg{{position:absolute;right:85px;top:163px;font-size:22px;color:#C9A96A}}
.eb{{position:absolute;left:82px;top:328px;font-size:26px;letter-spacing:5px;font-weight:800;color:#C9A96A}}
.pf{{font-family:PF;font-variant-numeric:lining-nums}}
.big{{font-family:PF;font-weight:900;line-height:1.42;font-variant-numeric:lining-nums}}
.lab{{font-size:27px;color:#2a2a2a}}
.chg{{font-size:34px;color:#666}} .chg b{{color:#1E1E1E}}
.rule{{width:120px;height:2px;background:#C9A96A}}
.note{{font-size:26px;color:#777;margin-top:6px}}
"""
def page(n, body):
    return f"<html><head><style>{CSS}</style></head><body><div class='hdr'></div><svg width='30' height='30' viewBox='0 0 30 30' style='position:absolute;left:735px;top:186px'><polygon points='29.20,15.00 29.17,15.37 29.09,15.74 28.95,16.10 28.77,16.45 28.55,16.78 28.30,17.11 28.02,17.41 27.74,17.71 27.45,17.99 27.17,18.26 26.91,18.53 26.67,18.79 26.46,19.06 26.29,19.33 26.15,19.62 26.05,19.92 25.98,20.24 25.94,20.57 25.92,20.93 25.91,21.30 25.92,21.69 25.92,22.09 25.92,22.50 25.89,22.91 25.84,23.32 25.76,23.71 25.64,24.09 25.48,24.44 25.28,24.76 25.04,25.04 24.76,25.28 24.44,25.48 24.09,25.64 23.71,25.76 23.32,25.84 22.91,25.89 22.50,25.92 22.09,25.92 21.69,25.92 21.30,25.91 20.93,25.92 20.57,25.94 20.24,25.98 19.92,26.05 19.62,26.15 19.33,26.29 19.06,26.46 18.79,26.67 18.53,26.91 18.26,27.17 17.99,27.45 17.71,27.74 17.41,28.02 17.11,28.30 16.78,28.55 16.45,28.77 16.10,28.95 15.74,29.09 15.37,29.17 15.00,29.20 14.63,29.17 14.26,29.09 13.90,28.95 13.55,28.77 13.22,28.55 12.89,28.30 12.59,28.02 12.29,27.74 12.01,27.45 11.74,27.17 11.47,26.91 11.21,26.67 10.94,26.46 10.67,26.29 10.38,26.15 10.08,26.05 9.76,25.98 9.43,25.94 9.07,25.92 8.70,25.91 8.31,25.92 7.91,25.92 7.50,25.92 7.09,25.89 6.68,25.84 6.29,25.76 5.91,25.64 5.56,25.48 5.24,25.28 4.96,25.04 4.72,24.76 4.52,24.44 4.36,24.09 4.24,23.71 4.16,23.32 4.11,22.91 4.08,22.50 4.08,22.09 4.08,21.69 4.09,21.30 4.08,20.93 4.06,20.57 4.02,20.24 3.95,19.92 3.85,19.62 3.71,19.33 3.54,19.06 3.33,18.79 3.09,18.53 2.83,18.26 2.55,17.99 2.26,17.71 1.98,17.41 1.70,17.11 1.45,16.78 1.23,16.45 1.05,16.10 0.91,15.74 0.83,15.37 0.80,15.00 0.83,14.63 0.91,14.26 1.05,13.90 1.23,13.55 1.45,13.22 1.70,12.89 1.98,12.59 2.26,12.29 2.55,12.01 2.83,11.74 3.09,11.47 3.33,11.21 3.54,10.94 3.71,10.67 3.85,10.38 3.95,10.08 4.02,9.76 4.06,9.43 4.08,9.07 4.09,8.70 4.08,8.31 4.08,7.91 4.08,7.50 4.11,7.09 4.16,6.68 4.24,6.29 4.36,5.91 4.52,5.56 4.72,5.24 4.96,4.96 5.24,4.72 5.56,4.52 5.91,4.36 6.29,4.24 6.68,4.16 7.09,4.11 7.50,4.08 7.91,4.08 8.31,4.08 8.70,4.09 9.07,4.08 9.43,4.06 9.76,4.02 10.08,3.95 10.38,3.85 10.67,3.71 10.94,3.54 11.21,3.33 11.47,3.09 11.74,2.83 12.01,2.55 12.29,2.26 12.59,1.98 12.89,1.70 13.22,1.45 13.55,1.23 13.90,1.05 14.26,0.91 14.63,0.83 15.00,0.80 15.37,0.83 15.74,0.91 16.10,1.05 16.45,1.23 16.78,1.45 17.11,1.70 17.41,1.98 17.71,2.26 17.99,2.55 18.26,2.83 18.53,3.09 18.79,3.33 19.06,3.54 19.33,3.71 19.62,3.85 19.92,3.95 20.24,4.02 20.57,4.06 20.93,4.08 21.30,4.09 21.69,4.08 22.09,4.08 22.50,4.08 22.91,4.11 23.32,4.16 23.71,4.24 24.09,4.36 24.44,4.52 24.76,4.72 25.04,4.96 25.28,5.24 25.48,5.56 25.64,5.91 25.76,6.29 25.84,6.68 25.89,7.09 25.92,7.50 25.92,7.91 25.92,8.31 25.91,8.70 25.92,9.07 25.94,9.43 25.98,9.76 26.05,10.08 26.15,10.38 26.29,10.67 26.46,10.94 26.67,11.21 26.91,11.47 27.17,11.74 27.45,12.01 27.74,12.29 28.02,12.59 28.30,12.89 28.55,13.22 28.77,13.55 28.95,13.90 29.09,14.26 29.17,14.63' fill='#0095F6'/><path d='M9.6 15.4 L13.3 19 L20.6 11.3' fill='none' stroke='#fff' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/></svg>{body}</body></html>"
UP='&#9652;'; DN='&#9662;'
def chg(arrow, val, tail='vs last week'):
    a = f"<span style='font-size:30px'>{arrow}</span> " if arrow else ''
    return f"<div class='chg'>{a}<b>{val}</b> {tail}</div>"

slides={}
slides[1]=page(1,"""
<div class='pf' style='position:absolute;left:82px;top:330px;font-size:122px;line-height:1.04'>Georgian Bay<br>Market Update</div>
<div style='position:absolute;left:84px;top:600px;font-size:36px'>November 16 to 22, 2026</div>
<div class='rule' style='position:absolute;left:82px;top:690px'></div>
<div class='big' style='position:absolute;left:78px;top:655px;font-size:340px'>8.8</div>
<div style='position:absolute;left:84px;top:1150px;font-size:44px'>months of inventory</div>
<div style='position:absolute;left:82px;top:1222px;height:72px;padding:0 40px;border-radius:36px;background:#C9A96A;color:#fff;font-weight:800;font-size:28px;letter-spacing:6px;line-height:72px'>BUYER&rsquo;S MARKET</div>
""")
# gauge
cx,cy,r=540,800,320
def arc(a0,a1,col):
    p0=(cx+r*math.cos(math.radians(a0)),cy-r*math.sin(math.radians(a0)))
    p1=(cx+r*math.cos(math.radians(a1)),cy-r*math.sin(math.radians(a1)))
    return f"<path d='M{p0[0]:.1f},{p0[1]:.1f} A{r},{r} 0 0 1 {p1[0]:.1f},{p1[1]:.1f}' stroke='{col}' stroke-width='76' fill='none'/>"
ang=24
nx,ny=cx+260*math.cos(math.radians(ang)),cy-260*math.sin(math.radians(ang))
svg=f"""<svg width='1080' height='1350' style='position:absolute;left:0;top:0'>
{arc(180,124,'#E8DCC8')}{arc(119,61,'#E0CFB0')}{arc(56,0,'#C9A96A')}
<line x1='{cx}' y1='{cy}' x2='{nx:.1f}' y2='{ny:.1f}' stroke='#1E1E1E' stroke-width='6' stroke-linecap='round'/>
<circle cx='{cx}' cy='{cy}' r='14' fill='#F5F0EA' stroke='#1E1E1E' stroke-width='6'/>
<text x='{cx}' y='{cy-r-45}' text-anchor='middle' font-family='NS' font-size='28' fill='#777'>Balanced</text>
<text x='{cx-r}' y='{cy+45}' text-anchor='middle' font-family='NS' font-size='28' fill='#777'>Seller&#8217;s</text>
<text x='{cx+r}' y='{cy+45}' text-anchor='middle' font-family='NS' font-size='28' font-weight='800' fill='#1E1E1E'>Buyer&#8217;s</text>
</svg>"""
slides[2]=page(2, "<div class='eb'>MARKET CONDITIONS</div>"+svg+"""
<div class='pf' style='position:absolute;left:0;width:1080px;text-align:center;top:900px;font-size:84px'>Buyer&rsquo;s market</div>
<div style='position:absolute;left:0;width:1080px;text-align:center;top:1018px;font-size:30px;color:#777'>6+ months of inventory</div>
<div style='position:absolute;left:0;width:1080px;text-align:center;top:1110px;font-size:38px;line-height:1.5'>Sales rose, but new listings rose faster.<br>Months of inventory climbed to 8.8.</div>
""")
def pair(n, eb, a, b):
    def blk(lab, val, ch, note, size):
        return f"<div><div class='lab' style='font-size:36px'>{lab}</div><div class='big' style='font-size:{int(size*1.3)}px;margin-top:0'>{val}</div><div style='font-size:34px;margin-top:4px'>{ch}</div>{note}</div>"
    return page(n, f"<div class='eb'>{eb}</div><div style='position:absolute;left:82px;right:82px;top:410px;bottom:70px;display:flex;flex-direction:column;justify-content:space-around'>"+blk(*a)+"<div class='rule' style='margin:28px 0'></div>"+blk(*b)+"</div>")
slides[3]=pair(3,'SALES AND PRICES',
  ('Sales','112',chg(UP,'3.7%'),'',170),
  ('Average sale price',"<span style='font-size:70px;vertical-align:75px'>$</span>716,441",chg(UP,'1.7%'),'',150))
slides[4]=pair(4,'LISTINGS',
  ('New listings','378',chg(UP,'12.8%'),"<div class='note'>Up from 335 the week before</div>",150),
  ('Active listings','4,631',chg(DN,'54','from last week'),"<div class='note'>The total pool of homes for sale is still shrinking</div>",135))
slides[5]=pair(5,'RATIOS',
  ('Sales-to-new-listings ratio',"30<span style='font-size:100px'>%</span>",chg(DN,'2 pts'),"<div class='note'>30 sales for every 100 new listings</div>",140),
  ('List-to-sale price ratio',"95<span style='font-size:100px'>%</span>",chg('','No change'),"<div class='note'>Down from 96.8% in September. Sellers are giving more ground.</div>",140))
def trend(n,title,vals,yf,note,line6=False):
    xs=[112+i*168 for i in range(6)]; labels=['Oct 12','Oct 19','Oct 26','Nov 2','Nov 9','Nov 16']
    pts=[(x,yf(v)) for x,v in zip(xs,vals)]
    s="<svg width='1080' height='1350' style='position:absolute;left:0;top:0'>"
    if line6:
        s+=f"<line x1='82' y1='912' x2='982' y2='912' stroke='#C9A96A' stroke-width='2' stroke-dasharray='8 6'/><text x='982' y='900' text-anchor='end' font-family='NS' font-size='24' font-weight='700' fill='#C9A96A'>6+ months = buyer&#8217;s market</text>"
    s+="<polyline points='"+' '.join(f'{x},{y:.0f}' for x,y in pts)+"' fill='none' stroke='#C9A96A' stroke-width='4'/>"
    for i,((x,y),v) in enumerate(zip(pts,vals)):
        last=i==5
        s+=f"<circle cx='{x}' cy='{y:.0f}' r='{11 if last else 8}' fill='#F5F0EA' stroke='{'#1E1E1E' if last else '#C9A96A'}' stroke-width='{5 if last else 3}'/>"
        up = i==0 or i==5 or vals[i]>=max(vals[i-1], vals[min(i+1,5)])
        ty = y-26 if (vals[i]>= (vals[i-1] if i else vals[1])) else y+48
        s+=f"<text x='{x}' y='{ty:.0f}' text-anchor='middle' font-family='NS' font-size='34' font-weight='800' fill='#1E1E1E'>{v:g}</text>"
    s+="<line x1='82' y1='1116' x2='982' y2='1116' stroke='#ccc' stroke-width='2'/>"
    for x,l in zip(xs,labels): s+=f"<text x='{x}' y='1165' text-anchor='middle' font-family='NS' font-size='27' fill='#777'>{l}</text>"
    s+="</svg>"
    return page(n, "<div class='eb'>TREND WATCH</div>"+f"<div class='pf' style='position:absolute;left:82px;top:395px;font-size:76px'>{title}</div><div style='position:absolute;left:83px;top:495px;font-size:28px;color:#777'>Last six weeks, by week starting</div>"+s+f"<div style='position:absolute;left:83px;top:1225px;font-size:34px;right:82px'>{note}</div>")
slides[6]=trend(6,'Months of inventory',[9.2,9.2,7.9,8.5,8.3,8.8],lambda v:912-(v-6)*61.6,'Up to 8.8 this week, the highest since October 19.',True)
slides[7]=trend(7,'Days on market',[44,40,50,60,57,56],lambda v:1020-(v-30)*13.5,'56 days this week, down 1. Second weekly decline in a row.')
slides[8]=page(8,"""<div class='eb'>WHAT IT MEANS</div>
<div style='position:absolute;left:82px;top:405px;width:916px'>
<div style='font-size:28px;font-weight:800;letter-spacing:4px'>FOR SELLERS</div>
<div class='pf' style='font-size:66px;line-height:1.15;margin-top:14px'>Competition grew this week. Price against the 378 homes that just listed.</div>
<div style='font-size:28px;font-weight:800;letter-spacing:4px;margin-top:48px'>FOR BUYERS</div>
<div class='pf' style='font-size:66px;line-height:1.15;margin-top:14px'>Sellers are giving more ground. Homes sold at 95% of asking.</div>
<div class='rule' style='margin-top:44px'></div>
<div style='font-size:40px;line-height:1.4;margin-top:36px'>Thinking about a move in Midland, Penetanguishene, Tiny, Tay or Wasaga Beach? Send me a message.</div>
</div>""")
for n,h in slides.items(): open(os.path.join(OUT,f's{n}.html'),'w').write(h)


# ---- render + overlap check (both required, SOP section 8 Carousel) ----
JS = """
(()=>{
 const boxes=[];
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 let n; while(n=w.nextNode()){ if(!n.textContent.trim()) continue;
   const r=document.createRange(); r.selectNodeContents(n);
   for(const b of r.getClientRects()) if(b.width>0) boxes.push({t:n.textContent.trim().slice(0,30),x1:b.left,y1:b.top,x2:b.right,y2:b.bottom,p:n.parentNode}); }
 document.querySelectorAll('svg text').forEach(e=>{const b=e.getBoundingClientRect(); boxes.push({t:e.textContent,x1:b.left,y1:b.top,x2:b.right,y2:b.bottom,p:e});});
 const hits=[];
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j]; if(a.p===b.p||a.p.contains(b.p)||b.p.contains(a.p)) continue;
   const ox=Math.min(a.x2,b.x2)-Math.max(a.x1,b.x1), oy=Math.min(a.y2,b.y2)-Math.max(a.y1,b.y1);
   if(ox>2&&oy>2) hits.push(a.t+' | '+b.t+' ('+Math.round(oy)+'px)');}
 const bottom=Math.max(...boxes.map(b=>b.y2)); const right=Math.max(...boxes.map(b=>b.x2));
 return {hits, bottom:Math.round(bottom), right:Math.round(right)};
})()
"""

from playwright.sync_api import sync_playwright
from PIL import Image
bad = False
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 1080, 'height': 1350})
    for n in range(1, 9):
        f = os.path.abspath(os.path.join(OUT, f's{n}.html'))
        pg.goto('file://' + f); pg.wait_for_timeout(400)
        r = pg.evaluate(JS)
        ok = not r['hits'] and r['bottom'] <= 1290
        bad |= not ok
        print(n, 'OK' if ok else 'FAIL', r)
        png = os.path.join(OUT, f'ig-carousel-{n}.png'); pg.screenshot(path=png)
        Image.open(png).convert('RGB').save(os.path.join(OUT, f'ig-carousel-{n}.jpg'), quality=90)
    b.close()
print('carousel_check: FAIL' if bad else 'carousel_check: OK')
sys.exit(1 if bad else 0)
