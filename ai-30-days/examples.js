// Fictional "what good looks like" mockups. Sample Realty only. No real clients.

function brand() {
  return `<p class="ex__brand">Sample Realty <span>| Alex Sample, REALTOR®</span></p>`;
}

const mocks = {
  1: () => `
    <div class="ex ex--mail">
      <div class="ex__mailbar"><span class="ex__dot"></span><span class="ex__dot"></span><span class="ex__dot"></span><strong>Inbox</strong></div>
      <p class="ex__from">Alex Sample <span>to Jordan Lee</span></p>
      <p class="ex__subject">Re: Showing at 123 Banana Street</p>
      <p>Hi Jordan, Thursday at 5:30 p.m. works. I will meet you at 123 Banana Street. The lockbox code stays with me until we are on the porch.</p>
      <p class="ex__sign">Alex Sample<br>Sample Realty</p>
    </div>`,
  2: () => `
    <div class="ex ex--chat">
      <p class="ex__who">You, by voice</p>
      <p class="ex__bubble ex__bubble--me">Tell Jordan Thursday at 5:30 still works for Banana Street, and save this as my email reply prompt.</p>
      <p class="ex__who">Saved prompt: Email reply</p>
      <p class="ex__bubble">Draft ready. Nothing has been sent. Your saved prompt is named Email reply.</p>
    </div>`,
  3: () => `
    <div class="ex ex--paper">
      ${brand()}
      <h3>Three tasks to hand off</h3>
      <ol class="ex__tasks">
        <li><b>Old email replies</b><span>Start with five. About 40 min a week.</span></li>
        <li><b>Showing day summary</b><span>Dictate it after the last door. About 20 min.</span></li>
        <li><b>Review requests</b><span>One text, one email, from a saved template.</span></li>
      </ol>
    </div>`,
  4: () => `
    <div class="ex ex--paper">
      ${brand()}
      <h3>About me</h3>
      <p>I help people buying and selling homes around Georgian Bay. I sound like a neighbour, not a brochure. I explain the next step in plain words.</p>
      <p>I do not invent prices, dates, or promises. If I do not know, I say so and I check.</p>
    </div>`,
  5: () => `
    <div class="ex ex--paper">
      ${brand()}
      <h3>SOP</h3>
      <ol class="ex__rules">
        <li><b>1. Approval line.</b> You draft. I approve before anything goes out.</li>
        <li>Do not invent facts, prices, or dates.</li>
        <li>Ask before you assume how I would say it.</li>
        <li>Keep client details in the note, not in a guess.</li>
      </ol>
    </div>`,
  6: () => `
    <div class="ex ex--mail">
      <p class="ex__kicker">Email writing SOP</p>
      <p class="ex__subject">Short, warm, one ask</p>
      <p>Hi Sam and Priya, the home inspection is booked for Tuesday at 9:00 a.m. I will meet the inspector at 45 Orchard Lane. Call me if that time does not work.</p>
      <p class="ex__sign">Updated after your note: no exclamation marks.</p>
    </div>`,
  7: () => `
    <div class="ex ex--phone">
      <p class="ex__phonebar">Texts</p>
      <p class="ex__label">Check-in</p>
      <p class="ex__bubble ex__bubble--me">Hi Sam, just checking in. Want me to send anything new this week?</p>
      <p class="ex__label">After a showing</p>
      <p class="ex__bubble ex__bubble--me">Thanks for coming through 123 Banana Street. What did you think of the kitchen?</p>
      <p class="ex__label">Thank-you</p>
      <p class="ex__bubble ex__bubble--me">Really glad we got this done. Thank you for trusting me with it.</p>
    </div>`,
  8: () => `
    <div class="ex ex--chat">
      <p class="ex__who">End of chat</p>
      <p class="ex__bubble">Saved: Email writing SOP, and the decision to skip exclamation marks. SOP, first line: I draft, you approve, nothing goes out until you say so.</p>
    </div>`,
  9: () => `
    <div class="ex ex--mail">
      <div class="ex__mailbar"><strong>Five oldest</strong></div>
      <ul class="ex__inbox">
        <li><b>Priya Sample</b><span>Inspection time</span><em>Draft ready</em></li>
        <li><b>Jordan Lee</b><span>Offer questions</span><em>Draft ready</em></li>
        <li><b>Mina Chen</b><span>Keys</span><em>Draft ready</em></li>
        <li><b>Sam Okonkwo</b><span>Utility transfer</span><em>Draft ready</em></li>
        <li><b>Riley Nguyen</b><span>Open house</span><em>Draft ready</em></li>
      </ul>
    </div>`,
  10: () => `
    <div class="ex ex--phone">
      <p class="ex__phonebar">Message to Sam Sample</p>
      <p class="ex__bubble ex__bubble--me">Sam, it was a pleasure selling 123 Banana Street with you. If you have a minute, a Google review helps the next family find me. Here is the link: example.com/review/sample-realty</p>
      <p class="ex__fine">You still tap send. The link is a sample, not a live one.</p>
    </div>`,
  11: () => `
    <div class="ex ex--ig">
      <div class="ex__igpic">Harbour light<br>on the main street</div>
      <p class="ex__ighandle">alexsample.realty</p>
      <p>Ten posts you liked had short lines and one photo. Here is a new version, in that style, for your business. Not posted.</p>
    </div>`,
  12: () => `
    <div class="ex ex--paper">
      ${brand()}
      <h3>Taste summary</h3>
      <p class="ex__fonts"><span style="font-family:Georgia,serif">Playfair-like headlines</span><span>Plain sans for captions</span></p>
      <div class="ex__swatches">
        <i style="background:#243044"></i><i style="background:#F4EFE6"></i><i style="background:#2F6F62"></i><i style="background:#C4A574"></i>
      </div>
      <p>Ink, paper, pine, and brass. Quiet, not loud.</p>
    </div>`,
  13: () => `
    <div class="ex ex--drive">
      <p class="ex__kicker">Shared folder only</p>
      <h3>Photos for posts</h3>
      <ul>
        <li>Headshots</li>
        <li>Listing photos</li>
        <li>Local spots</li>
        <li>Logo</li>
      </ul>
      <p class="ex__fine">The rest of the drive stays private.</p>
    </div>`,
  14: () => `
    <div class="ex ex--paper">
      ${brand()}
      <h3>Brand guide, one page</h3>
      <div class="ex__swatches">
        <i style="background:#243044"></i><i style="background:#F4EFE6"></i><i style="background:#2F6F62"></i><i style="background:#C4A574"></i>
      </div>
      <p><b>Voice.</b> Short sentences. Neighbour, not slogan.</p>
      <p><b>Type.</b> Serif for the name. Sans for everything else.</p>
      <p><b>Posts.</b> One photo, one place, one next step.</p>
    </div>`,
  15: () => `
    <div class="ex ex--ig">
      <div class="ex__igpic ex__igpic--food">The corner bakery<br>Saturday morning</div>
      <p class="ex__ighandle">alexsample.realty</p>
      <p>First post. Local, specific, and posted by you after you approved the caption.</p>
    </div>`,
  16: () => `
    <div class="ex ex--split">
      <div class="ex ex--ig">
        <div class="ex__igpic">Market day</div>
        <p><b>Post 2</b> Ready for you to publish.</p>
      </div>
      <div class="ex ex--ig">
        <div class="ex__igpic">Dock at dusk</div>
        <p><b>Post 3</b> <span class="ex__chip">Scheduled Tue 9:00 a.m.</span></p>
      </div>
    </div>`,
  17: () => `
    <div class="ex ex--cal">
      <p class="ex__calhead">Thursday</p>
      <article>
        <b>Listing appointment</b>
        <span>2:00 to 4:00 p.m.</span>
        <span>123 Banana Street</span>
        <span>Sam and Priya Sample</span>
      </article>
      <article class="ex__leave">
        <b>Leave home</b>
        <span>1:20 p.m. reminder</span>
        <span>22 min drive, from your house</span>
      </article>
    </div>`,
  18: () => `
    <div class="ex ex--crm">
      <p class="ex__kicker">CRM note, like Follow Up Boss</p>
      <h3>Sam and Priya Sample</h3>
      <p class="ex__crmmeta">123 Banana Street · Buyer</p>
      <div class="ex__note">
        <b>Today, pop-by</b>
        <p>Met Sam at the house. Kids are Lea and Owen. They want a fenced yard and a closing before summer break. Next step: send two more streets on Friday.</p>
      </div>
    </div>`,
  19: () => `
    <div class="ex ex--mail">
      <p class="ex__from">Draft, not sent <span>to Mina Chen</span></p>
      <p class="ex__subject">The maple on Orchard Lane</p>
      <p>Hi Mina, I drove past 45 Orchard Lane this week and the maple you liked is turning. Hope you, Chris, and the twins are settled in.</p>
      <p class="ex__sign">Follow-up ideas: school-year check-in, a note before the first winter, introduce them to the bakery on the corner.</p>
    </div>`,
  20: () => `
    <div class="ex ex--paper">
      ${brand()}
      <p class="ex__kicker">Top 5 template · fake property</p>
      <h3>123 Banana Street</h3>
      <ol class="ex__top">
        <li>A kitchen that faces the morning yard.</li>
        <li>Two bedrooms on the same floor for guests.</li>
        <li>A garage you can stand up in.</li>
        <li>A quiet street, one block off the shops.</li>
        <li>A porch deep enough for a chair.</li>
      </ol>
    </div>`,
  21: () => `
    <div class="ex ex--drive">
      <p class="ex__kicker">Letter of Opinion · this folder only</p>
      <ul>
        <li>Letter-of-Opinion-template.docx</li>
        <li>signature-photo.jpg</li>
      </ul>
      <p class="ex__fine">Share this folder. Do not share the whole drive.</p>
    </div>`,
  22: () => `
    <div class="ex ex--letter">
      <header>
        <strong>Sample Realty</strong>
        <span>Alex Sample, REALTOR®</span>
      </header>
      <p class="ex__kicker">Letter of Opinion</p>
      <h3>123 Banana Street</h3>
      <p>Prepared for Jordan Lee. This practice letter uses a past deal, then the same steps are timed on a real one.</p>
      <p class="ex__range">Sample range only</p>
      <p class="ex__sign">Your name and signature sit on the letter. The original agent's details are gone.</p>
    </div>`,
  23: () => `
    <div class="ex ex--paper">
      ${brand()}
      <p class="ex__kicker">Coles Notes · emailed to you, not the client</p>
      <h3>123 Banana Street</h3>
      <dl class="ex__dl">
        <dt>Price</dt><dd>$640,000</dd>
        <dt>Deposit</dt><dd>$25,000</dd>
        <dt>Conditions</dt><dd>Financing, 5 days. Inspection, 7 days.</dd>
        <dt>Closing</dt><dd>June 12</dd>
        <dt>Inclusions</dt><dd>Fridge, stove, washer, dryer</dd>
        <dt>Excluded</dt><dd>Dining light</dd>
      </dl>
    </div>`,
  24: () => `
    <div class="ex ex--cal">
      <p class="ex__calhead">Deal dates · 123 Banana Street</p>
      <article><b>Financing condition</b><span>May 8 · remind May 5</span></article>
      <article><b>Inspection condition</b><span>May 10 · remind May 7</span></article>
      <article><b>Title search</b><span>May 29 · remind May 26</span></article>
      <article><b>Closing</b><span>June 12 · remind June 9</span></article>
    </div>`,
  25: () => `
    <div class="ex ex--card">
      <p class="ex__kicker">Deal card</p>
      <h3>Jordan Lee</h3>
      <dl class="ex__dl">
        <dt>Phone</dt><dd>705-555-0142</dd>
        <dt>Wants</dt><dd>3 beds near the harbour</dd>
        <dt>Last touch</dt><dd>Called Tuesday</dd>
        <dt>Next step</dt><dd>Send two listings</dd>
        <dt>Date</dt><dd>Friday</dd>
      </dl>
    </div>`,
  26: () => `
    <div class="ex ex--paper">
      <h3>Ten calls</h3>
      <ol class="ex__calls">
        <li>Jordan Lee <span>Opener ready</span></li>
        <li>Sam Sample <span>Opener ready</span></li>
        <li>Mina Chen <span>Opener ready</span></li>
        <li>Riley Nguyen <span>Opener ready</span></li>
        <li>Priya Sample <span>Opener ready</span></li>
        <li>Owen Park <span>Opener ready</span></li>
        <li>Lea Ortiz <span>Opener ready</span></li>
        <li>Chris Adeyemi <span>Opener ready</span></li>
        <li>Noah Singh <span>Opener ready</span></li>
        <li>Emma Walsh <span>Opener ready</span></li>
      </ol>
    </div>`,
  27: () => `
    <div class="ex ex--card">
      <p class="ex__kicker">Notes pasted back</p>
      <h3>Jordan Lee</h3>
      <p>Called. Liked the porch, worried about the driveway. Next: send 45 Orchard Lane before Thursday.</p>
      <p class="ex__fine">Habit: three times a week. Then the next 10.</p>
    </div>`,
  28: () => `
    <div class="ex ex--forms">
      <article>
        <b>RECO guide</b>
        <span>Blank master, editable PDF</span>
      </article>
      <article>
        <b>Listing agreement</b>
        <span>Schedule A attached</span>
        <span>Commission 5% total</span>
        <span>2.5% to the co-operating brokerage</span>
        <span>60-day holdover</span>
      </article>
      <p class="ex__fine">The RECO guide and Form 200 masters are in your kit. Names and address come from the GeoWarehouse report. Postal code is checked. You still fill the start date and the number of days.</p>
    </div>`,
  29: () => `
    <div class="ex ex--split">
      <div class="ex ex--cal">
        <p class="ex__calhead">BrokerBay · mock</p>
        <article>
          <b>Showing</b>
          <span>Sat 11:10 a.m.</span>
          <span>123 Banana Street</span>
          <span>18 min from the last door</span>
        </article>
      </div>
      <div class="ex ex--phone">
        <p class="ex__phonebar">Client note, not sent</p>
        <p class="ex__bubble ex__bubble--me">You are confirmed for Saturday at 11:10 a.m. at 123 Banana Street. I will meet you out front.</p>
      </div>
    </div>`,
  30: () => `
    <div class="ex ex--paper">
      ${brand()}
      <h3>Month review</h3>
      <ul class="ex__review">
        <li>Used every week: email drafts, texts, deal cards.</li>
        <li>Decision log cleaned to one copy. Approval line is still rule 1.</li>
        <li>Your Step 2 choice, written down.</li>
      </ul>
    </div>`,
};

const byKey = {
  email: mocks[6],
  chat: mocks[2],
  tasks: mocks[3],
  about: mocks[4],
  rules: mocks[5],
  texts: mocks[7],
  sop: mocks[8],
  inbox: mocks[9],
  review: mocks[10],
  instagram: mocks[11],
  swatches: mocks[12],
  drive: mocks[13],
  brand: mocks[14],
  scheduled: mocks[16],
  calendar: mocks[17],
  crm: mocks[18],
  top5: mocks[20],
  letter: mocks[22],
  coles: mocks[23],
  deadlines: mocks[24],
  deal: mocks[25],
  calls: mocks[26],
  forms: mocks[28],
  showing: mocks[29],
  review30: mocks[30],
};

export function exampleMarkup(visual) {
  const draw = byKey[visual] || mocks[visual];
  return draw ? draw() : "";
}
