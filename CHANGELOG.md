# jonathanwallace.ca change log

What changed on the site, when, and why. Newest first. Times are America/Toronto.
Any assistant (Claude, Cursor agents, Grok Bot teammates) should read this before editing the site, and add an entry after every change.

## Standing rules for anyone editing the site
- Brand: Midnight Estate. Charcoal #1B1B1B, champagne gold #C9A96A (accent only), ivory #F7F3EC. No pure white (#fff); ivory is the lightest tone. Headlines in Playfair Display only (DEC-20261022-01), body and labels in Nunito Sans. No Source Serif or Inter.
- Blog card thumbnails are never a header at the top of an article (DEC-20261012-01). The article opens on kicker, title, byline and intro; the card can sit lower in the body.
- Byline is "Jonathan Wallace, REALTOR®" (DEC-20261022-02). No em dashes in headers or written copy (DEC-20261021-13). Footer column titles are p.footer__h, not h4, so page headings stay in order.
- Title is always "REALTOR®". Always write "Jonathan Wallace" in full. No em dashes. No cliches (nestled, turnkey, cozy, stunning, dream home, and similar).
- Proof line: $300M+ career sales, 500+ families served, 4.96 stars on RateMyAgent across 16 verified reviews, number one rated agent in Midland and Penetanguishene on RateMyAgent, 2025 Midland Readers' Choice Award Best Realtor.
- Resources was removed from the top menu on purpose (Oct 30, Jonathan Wallace's request). It lives in the footer only. Do not restore it to the top menu.
- Listing pages must match REALTOR.ca. Listings that come off REALTOR.ca get disabled with a redirect to the homepage.
- Listing descriptions stay word for word as they appear on REALTOR.ca, including words the voice rules otherwise ban (stunning, cozy and similar). Do not rewrite them (Jonathan Wallace, Nov 3, DEC-20261103-listing-copy-matches-realtor-ca).
- Interview and town pages use the shared site header, footer and styles.css, not one-off templates.

## 2026-11-10

### AI bootcamp: fixes before the talk
Why: Jonathan approved five fixes before tonight's talk.
- The Progress tab no longer refreshes while a selfie preview is on screen or an upload is in progress. Cancel or a finished upload lets the refresh resume.
- A learner with no finished lesson sees "Welcome in. Finish your first lesson to join the leaderboard." The ahead and behind lines start after the first finished lesson.
- Jonathan Wallace is left off the public leaderboard and out of the peer comparison. His practice post, and the Zztest Council and Zztest Selfie rows, are removed when the database migration runs.
- Learners no longer see Remove on the message board. Removing a post is on the admin page only.
- The resource zip now includes the Letter of Opinion kit, the client email template, the Deal Card kit, Prompts by Area, and a sample one-page Letter of Opinion. Names, phone, email, office address, and brokerage in those files are placeholders. The 30-day checklist is not in the zip.

### AI bootcamp: comments-style message board
Why: Jonathan asked for the live message board to read like an Instagram or Facebook comments section.
- Each note is a row with a round initials avatar, a bold first name and last initial, the note, then a grey line with the relative time, a Learned / Question / Stuck on pill, the lesson title, and Reply. Replies sit indented under the note, and a thread with more than two replies stays collapsed behind View N more replies.
- A sticky Add a comment bar with a compact tag picker and a Post button sits at the bottom of the board. Points, replies, and admin removal work the same way as before.

### AI bootcamp: lesson titles in Title Case
Why: Jonathan asked for every lesson title to use Title Case, including the kit handouts and calendar names.
- Major words are capitalized. Short words such as and, to, in, on, of, with, and then stay lowercase unless they are the first or last word. AI, BrokerBay, SOP, Coles Notes, and Top 5 stay as they are. The day numbers that save progress are unchanged.

## 2026-11-09

### AI bootcamp: download all the resources
Why: Jonathan asked for one clear download of the whole kit on the first page, before sign-in and after.
- A gold button, Download all the resources, sits under the pacing line. It saves ai-30-days/kit/ai-bootcamp-resources.zip, a handout and the prompts for each skill. Rebuild it with scripts/build_ai30_kit.py after a lesson change.

### AI bootcamp: buttons centred, and a Make selfie webhook
Why: Jonathan asked for every button to be easy to tap on a phone, and for selfies to be able to land in Google Drive through Make.com.
- Gold and outline buttons span the card and centre their label. Tap targets stay at least 44 pixels tall. On a phone the header stacks, the time chip sits under the lesson title, and reply buttons sit under the reply box.
- If AI30_SELFIE_WEBHOOK_URL is set, each selfie is posted to that webhook as a multipart file plus the filename, after the Blobs backup is saved. A Google service account remains the other way to reach Drive.

### AI bootcamp: private lesson notes removed
Why: Jonathan asked for the private notes box to come off the bottom of each lesson.
- The notes field is gone. The completion button and the group share box stay.

### AI bootcamp: print checklist removed
Why: Jonathan asked for the print checklist to come off the learning centre entirely.
- The button, the print view, and the code that built it are gone.

### AI bootcamp: points, live board, selfie unlock, and email
Why: Jonathan asked for a points contest through Friday, December 11 at 8 PM Eastern, a live group board, a private selfie that unlocks the points explainer, and an email on every sign-in.
- The All lessons tab and the progress bar stay off. A note says whether you are ahead of, in step with, or behind your peers, using points.
- Points: 3 per finished lesson, 2 for coming back the next day, 1 for a second visit the same day, 5 for one group note per lesson, and 3 for answering someone else's question once. The leaderboard closes Friday, December 11 at 8 PM. The winner gets 2 hours of one-on-one AI coaching with Jonathan. After that, the board freezes and names the winner. Lessons still work.
- The group board has Learned, Question, and Stuck on notes, one level of replies, and refreshes about every 20 seconds. Names that start with Zztest stay off the board and the leaderboard.
- A selfie unlocks how points work. The success line is "Got your learning selfie. Good job. Now you know how to stack the deck and win." Photos are not shown to the group. They are stored as a backup and sent to Google Drive when that connection is set.
- Sign-in asks for an email. It is kept private and is not on the leaderboard or the board. The admin page at /ai-30-days/export.html downloads a CSV and can reset Testy and Zztest rows. It uses the AI30_ADMIN_KEY environment variable.
- Five lessons were rewritten: calendar booking, client notes, past clients, listing descriptions, and the Letter of Opinion.

### AI bootcamp: no All lessons tab, no progress bar, peer note and leaderboard
Why: Jonathan asked for the All lessons tab and any personal progress meter to come off, and for agents to see how they compare with the others who are learning.
- The All lessons tab and the list it opened are gone. A finished lesson opened from a link stays on the current lesson.
- The progress bar, percentages, and any "X of Y" count are gone. Completed lessons stay saved on the server.
- After sign-in, a short note says whether you are ahead of, behind, or in step with the other learners, using the median of their completed lessons. It does not give a number.
- The Progress tab is a leaderboard: rank, first name and last initial, and lessons completed. Your row is highlighted. Names that start with Zztest are left out of the note and the board.
- The button at the end of every lesson reads "I've completed the lesson and the challenge." It still opens the next lesson.

### AI bootcamp: skill titles only, and an SOP reminder
Why: Jonathan asked that agents see the skill they are learning, not a lesson number or a total, and that each lesson after the first SOP reminds them to log the decision.
- Cards, the sign-in topic list, the lock line, the completion line, the printable checklist, and the calendar event name use the skill title only. Internal day numbers still gate progress.
- From Build your brand guidelines on, the assignment ends with "Before you finish: log every decision you made today in your SOP, or update the SOP it belongs to." The closing prompt asks which SOP each decision belongs in. Pick your AI and Teach it your writing style keep their own closing step.
- The print checklist stays off the sign-in page. A button style was overriding the hidden attribute.

### AI bootcamp: 31 lessons
Why: Jonathan approved two new social lessons and a lesson-by-lesson final review, and asked for the sign-in page to show the path instead of a printable checklist.
- Lesson 10 is Plan your social media strategy. Lesson 11 is Create your first three posts. The old "post, then schedule two more" lesson is gone. Later lessons move up by one. The last lesson is 31, Final review. Your list is Lessons 25 to 30.
- Saved progress from the 30-lesson plan is mapped once: lessons 1 to 9 stay, a finished old lesson 10 counts as the new lesson 11, and old lessons 11 and up move forward by one. New lesson 10 stays open so that plan is not skipped.
- The sign-in page lists what the bootcamp covers, then every lesson title under its section. The print checklist is not on that page.

### AI bootcamp name: Zero to Hero
Why: Jonathan set the program name to AI Bootcamp: Zero to Hero.
- Page title, heading, sign-in bar, and the print title use that name. Calendar events stay titled AI Bootcamp: Lesson N.

### AI bootcamp: lessons, and a copy button on every prompt
Why: the program has a new name, and agents need to paste each prompt without selecting the text by hand.
- Visible name is AI Bootcamp: Hiring Your First AI Agent. Cards say Lesson, not Day. The address stays /ai-30-days, and saved progress is still stored by the same numbers.
- Each prompt is its own box with a Copy button. A lesson with more than one prompt has a button on each.

### AI in 30 days: revised plan
Why: Jonathan reviewed the 30 days and rewrote the order, the lessons, and the assignments.
- ai-30-days/days.json now follows that plan. Every day has an assignment, which the calendar reminder uses. Days 1 to 5 end with a short save. Days 6 to 30 end with the decision-log line. Day 7 is optional. Days 24 to 29 are the provisional "your list" lessons.
- Progress is still stored by day number. No one's place was moved.

### AI in 30 days: one day at a time, and a calendar reminder
Why: agents were able to peek at a later day, and they asked for a reminder they can drop on the phone calendar.
- A later day stays locked until the current day is marked done. The progress grid, the day list, the address bar, and the keyboard all keep it shut, with "Finish Day N to unlock". Marking today done saves on the server and moves straight to the next card.
- Each open day has Add reminder to my calendar. It asks the phone to add a 30-minute event the next morning (9:00 a.m., or a time they pick) from /api/ai-30-days/ics.
- The check sign-ins used to prove the gate were removed. The progress API does not delete records.

### Private training portal: AI in 30 days
Why: brokerage agents at the November 10 AI talk need a private link they can keep using, with progress that follows them from phone to laptop.
- New page at /ai-30-days. Standalone: no site header, nav, or footer, and no links to the rest of the site. Not in sitemap.xml or llms.txt. noindex, nofollow, noarchive, plus an X-Robots-Tag and a robots.txt Disallow. Title bar: AI Getting Started: Your First 30 Days. Sign-off is plain text.
- Sign in with first and last name only. The same name, any spacing or capital letters, opens the same place. Progress is stored in Netlify Database (name, day statuses, notes, timestamps). A copy is cached on the device. "Not you?" forgets the device.
- The 30 days live in ai-30-days/days.json so the list can be edited in one file. Each day has a short example of what good looks like. Days 7, 16, and 24 are marked as a good spot to catch up. Day 1 starts when that person first signs in.

### Straight Answers: is now a good time to sell waterfront
- Added /ask/is-now-a-good-time-to-sell-waterfront (Selling). Poster from the opening smile.

### Monthly market update: October 2026
Why: Jonathan Wallace asked for the monthly blog from Jeff Barr's October Simcoe County numbers.
- New post blog-market-update-october-2026.html, "Simcoe County Sold 14 Percent Fewer Homes Than Last October. In Midland and Penetanguishene, Homes Sold a Month Faster." Built on the July monthly template. Article, FAQPage and Breadcrumb schema. September community figures for days on market (about 74 and 65) are worked back from the board percentages and labelled "roughly".
- Card assets/img/market-october-2026-card.jpg (16:9, 1200x675). Artlist, last week's market card as the layout reference, house styled after the brick bungalow Jonathan Wallace supplied but not identical, no house number. Brand pass: drop shadow removed (DEC-20261103-02), lettering set to ivory #F7F3EC, gold rule. Sits below the real read section, not as a header (DEC-20261012-01). Also the og:image.
- blog.html: new card in the LATEST MARKET UPDATE slot; the Oct 26 to Nov 1 card moved to the top of the MARKET UPDATES ARCHIVE; ItemList rebuilt from visible order (76 items).
- sitemap.xml, llms.txt, the .html redirect, and /market-update-latest now point to the October monthly.

### New headshots
Why: Jonathan Wallace sent three new professional photos to replace his headshot.
- jonathan-wallace-headshot.jpg replaced in place with a 1200 by 1200 head and shoulders crop of the new front-facing standing photo. This covers every byline avatar, the town pages, and the JSON-LD and social image references, with no path changes.
- Homepage intro photo is now jonathan-wallace-portrait-standing.jpg (leaning on the table). About page intro photo is now jonathan-wallace-portrait-seated.jpg. Both are 1200 by 1500, matching the 4:5 .split__media frame. jonathan-wallace-headshot-full.jpg is no longer referenced and was left in place.

### About page: Giving back section rewritten
Why: Jonathan Wallace wanted the section less focused on Wasaga Beach and more about his own interest in local service groups and international service missions.
- Heading changed from "Proud supporter of our community" to "Invested in the people who show up". Eyebrow unchanged.
- Intro paragraph rewritten around local service groups and international service missions. The Paul Harris Fellow link is replaced with his wording: recognised by Rotary for his contributions to the organization. The Person JSON-LD award field is unchanged. Cause cards below are unchanged.

### 610 Concession 14 West: subject facts card removed
Why: Jonathan Wallace said the subject-property card is not part of the approved 188 Old Mill page.
- Removed the "The property" section (heading, card, PIN, lot, frontage, and the rest). Section order is now hero, buttons, Sold, For sale, Expired listings, Your Copies. The suggested list price line stays. PDFs were already in the 188 shape and were left as they are.

### Private evaluation for 610 Concession 14 West, Tiny
Why: Jonathan Wallace met Gabrielle Osborne and Warren Milne at the property and asked for a private evaluation page, the same kind as 188 Old Mill Road.
- New page at /eval/610-concession-14-west. Opinion $975,000 to $1,075,000 as of November 9, 2026, with suggested list price not higher than $1,100,000. Not in the nav, sitemap.xml, or llms.txt. Noindex.
- Sold, for sale, and expired listings from the November 9 REALM pull. Expired listings use the same card and gallery as the others. Water frontage is omitted where the property is not really on the water.
- Letter of opinion, portrait sold-comparables summary, and the combined PDF.

### Listings: disabled 2554 Champlain Road, Tiny and 375 Champlain Road, Penetanguishene
Why: both listings (MLS® S13643484 and S13722636) are no longer on REALTOR.ca as of the 9 Nov 2026 check, and listing pages must match REALTOR.ca. Pre-authorized by Jonathan Wallace.
- Disabled reversibly in netlify.toml with 302 redirects to the homepage for /listings/<slug>, the trailing slash and the .html form, same pattern as 1016 Wright Drive and 775 Ontario Street. The HTML files are untouched. To undo, restore the 200 rewrite and 301s.
- Removed 375 Champlain Road from the listings index card and JSON-LD list (positions renumbered), sitemap.xml, and llms.txt. 2554 Champlain Road had no index, sitemap or llms.txt entry.

### Listing pages: spec taps and the mobile action bar
Why: Microsoft Clarity, Nov 6 2026. A Facebook in-app mobile visitor on /listings/20-rue-eric-tiny swiped the photo carousel 27 times, then tapped the bedroom and bathroom details and nothing happened (dead click), then left. The Book a showing, Call, and Text buttons sat on the hero photo. The cookie notice is unchanged. Marketing owns a separate sitewide cookie bar, waiting on Jonathan's approval.
- Bedrooms link to the room sizes. Bathrooms link to the listing description. The other spec cards link to the details section. On pages where the summary names bedrooms or bathrooms, that line links to the details too. A spec with nowhere to go keeps the default cursor and no hover, so it does not look tappable.
- On phones, the Book a showing, Call, and Text bar stays at the bottom. It stays hidden while the photos are on screen, and while it would cover the same buttons in the page. On a wide screen it also stays off the hero photo, then returns once the photo has scrolled away. The buttons stay at least 44px tall. The data-cta and data-ga4 attributes are unchanged.
- If the existing cookie notice overlaps that bar, the bar moves up enough to clear it. The notice's own styles and script are not edited.

## 2026-11-08

### Straight Answers: helping parents plan a move
- Added /ask/helping-aging-parents-plan-a-move (Selling). Poster from the opening smile.

## 2026-11-07

### Fix: offer clause viewer cut off on mobile
Why: Jonathan Wallace reported that on mobile the sample offer viewer was cut off along the edges.
- blog-conditions-warranties-ontario-offer.html: on screens 700px and narrower the viewer is full-screen and opens at zoom 1, so the whole page width fits (was zoom 1.4, wider than the phone). Page labels capped to screen width so nothing scrolls sideways. The + button still zooms in. Desktop is unchanged (zoom 1.4).

## 2026-11-06

### 479 Margaret Street: full photo galleries
Why: Each comparable had one photo. Jonathan Wallace sent the full REALM galleries.
- Sold cards: 255 Lindsay 25, 531 Seventh 17, 639 Dominion 25, 14 Wolfe 25, 15 Lucy 17, 317 Wardell 23, 680 Ontario 25, 320 Yonge 25.
- Active cards: 762 Ottawa 20, 7 Victory 20, 323 Bell 20, 154 Robert St W 20.
- Photos are 640px JPEGs, same idea as the 188 Old Mill Road galleries. The lightbox markup is unchanged. Hero spacing and the removed waterfront rows stay.

### 479 Margaret Street: hero spacing, and waterfront only when it applies
Why: The address sat on the heading, and the byline sat on the price. Comparables that are not on the water were showing Water frontage as No.
- Page-local CSS only. 26px under the street heading and under the price, so the descenders leave about 16px of clear space. Under 430px the taller line-height stays, with 18px of margin, which is the same clear gap.
- Removed the Water frontage row from every comparable on this page. None of them are waterfront.

### Oct 26 to Nov 1 market update: report button
Why: Jonathan Wallace asked for this week's newsletter-linked market post to use the two-step option. Top button is now "Get Your Personalized Home Value Report" to /seller-valuation/ (was the Calendly in-home booking).

### Conditions guide: warranty paragraph reordered
Why: Jonathan Wallace asked for a logical, easy order: the promise, what happens if it fails before closing (seller repairs or replaces at their own expense), then that it ends at closing and is not an extended warranty.

### Conditions guide: seller repairs at their own expense
Why: Jonathan Wallace. The chattels section now says a failed appliance before closing is repaired or replaced at the seller's own expense.

### Conditions guide: warranty explained as a closing-day promise
Why: Jonathan Wallace's correction. A working-order promise holds up until closing; it is not an extended warranty, so a dishwasher that breaks in March is on the buyer.

### Conditions guide: report button goes to /seller-valuation/
Why: Jonathan Wallace confirmed /seller-valuation/ is the two-step page for "Get Your Personalized Home Value Report" (not /home-value).

### Conditions guide: shorter-looking page
Why: Jonathan Wallace wants the post to look less long. On this post only: body line height 1.75 to 1.65, paragraph gap 18px to 14px, and the On this page list in two columns (one on phones).

### Conditions guide: tighter space above section headings
Why: Jonathan Wallace said there was too much room between the end of one section and the next heading. Space above section headings cut from 52px to 34px on this post.

### Conditions guide: clause buttons beside the headings
Why: Jonathan Wallace asked to save space down the page. Each View clause button now sits on the same line as its section heading, slightly smaller, and wraps under the heading when there is no room (phones, sections with several buttons).

### 479 Margaret Street: phone hero lines no longer collide
Why: On a phone, "479 Margaret Street" wraps and the g sits on "Street", and "$395,000 to $430,000" wraps through itself. The address under the title was also tight against that g.
- eval/479-margaret-street only. Under 430px the heading and the value range use a taller line-height, and the heading has a little more room above the address. Desktop, tablet, the cards, and 188 Old Mill Road are unchanged.

### Conditions guide: in-person valuation button removed
Why: Jonathan Wallace asked to take out "Book an in-person valuation". The top of the post now has one centred button, "Get Your Personalized Home Value Report", to the two-step /home-value page.

### Conditions guide: two centred evaluation buttons
Why: Jonathan Wallace asked for both options under the title, centred: "Book an in-person valuation" (Calendly, book_home_evaluation) and "Get Your Personalized Home Value Report" (the two-step /home-value page, post_top_home_value).

### Conditions guide: top evaluation button goes to /home-value
Why: Jonathan Wallace wants the blog's home evaluation button on the two-step /home-value page, not the Calendly in-home booking. Label is now "Get a free home evaluation"; GA4 event post_top_home_value. The other posts still use the Calendly link from the Nov 3 council batch.

### Conditions guide: rental highlight, duplicate button, bold
Why: Jonathan Wallace's review.
- Rental items highlight now covers the last line of section 6 ("The Buyer agrees to co-operate..."); the HST box starts at section 7 so the two no longer overlap.
- Removed the duplicate "View financing clause" button from the home inspection section; financing has its own section and button.
- Bold now only marks condition, representation, warranty and disclosure in the intro; chattel, fixture, escape clause and pause clause are plain text.

### Private evaluation for 479 Margaret Street
Why: Jonathan Wallace needs a private client page to review, same pattern as 188 Old Mill Road.
- Added eval/479-margaret-street/ (page, three PDFs, one photo per comparable). Not in the nav, sitemap.xml, or llms.txt.
- _headers: X-Robots-Tag noindex, nofollow for /eval/479-margaret-street and everything under it.
- netlify.toml: pretty URL rewrites to index.html with force, plus the trailing-slash and index.html redirects, same as 188.

### Conditions guide: condition comparison changed
Why: Jonathan Wallace pointed out buyers don't get to test drive a house. A condition is now compared to agreeing to buy a used car as long as your mechanic gives it a clean bill of health.

### Conditions guide: Sources in two columns
Why: Jonathan Wallace asked for a shorter Sources list. Two columns on desktop and tablet, one on phones.

### Conditions guide rewritten in plain language
Why: Jonathan Wallace said the clauses were over-explained and full of legal wording. Every section now explains the clause for someone with little real estate experience, with everyday comparisons (buying a used car subject to your mechanic, turn the house upside down, a building's report card). Same sections, clause buttons and sample offer. About 40 percent shorter; read time ~11 min.

### Conditions guide: card moved above the Fictional terms box
Why: Jonathan Wallace asked for the hero shot directly above the fictional sample terms. It stays in the body under the intro, not a header (DEC-20261012-01).

### Conditions guide: clause viewer opens closer, softer highlight
Why: Jonathan Wallace asked for the View clause pages to open larger and easier to read, and for the gold highlight to be more transparent so the words show through.
- Viewer opens at 1.4x (was 1x), zoom steps of 0.2 up to 2.4x; wide pages scroll sideways instead of clipping. Highlight fill opacity .38 to .14.

### Conditions guide: representation and warranty bolded
Why: Jonathan Wallace noticed condition and disclosure were bold in the intro but representation and warranty were not. All four key terms are now bold.

### New post: Coles Notes: Common Conditions and Warranties in an Ontario Offer
Why: Jonathan Wallace asked for the offer clauses explainer (drafted in Grok) to go live as this week's newsletter feature. He confirmed permission to show the sample form pages.
- New post blog-conditions-warranties-ontario-offer.html in the current non-market format (Winter / Wills template, Playfair and Nunito Sans, 720px column). Card assets/img/blog-offer-conditions-warranties-card.jpg sits lower in the body, after the first section (DEC-20261012-01), and is the og:image and blog card.
- Clickable sample offer: 21 "View clause" buttons open a modal with the five sample pages (assets/img/offer-sample/page-1 to 5.jpg) and a gold highlight on the clause. Sample PDF at assets/downloads/123-banana-street-sample-offer-schedule-a.pdf. All terms are fictional (123 Banana Street, Sample Buyer, Sample Seller).
- Inspection wording corrected at Jonathan Wallace's direction: the home inspection condition requires an inspection satisfactory to the buyer and does not require a certified inspector.
- blog.html card first after the latest market update, ItemList rebuilt with the post at position 2; sitemap.xml, llms.txt and the .html redirect in netlify.toml added.

## 2026-11-07

### Straight Answers: two new videos, new "Living here" topic
- Added /ask/crea-forecast-where-are-ontario-prices-headed (Market) and /ask/what-is-boating-like-in-midland-and-tiny (new Living here topic; CTA is the private home search). Posters from each video's opening smile.

## 2026-11-05

### Weekly market update: October 26 to November 1, 2026
- New post blog-market-update-oct-26-nov-1-2026.html, "Sellers Stepped Back for Winter. The Homes That Stayed On Still Sold.". Hero assets/img/market-blog-market-update-oct-26-nov-1-2026.jpg sits lower in the body (DEC-20261012-01). Citation: Global News, Nov 4, 2026 (Canadian Press, TRREB October figures; competitor broker quote not used).
- blog.html: new card in the LATEST MARKET UPDATE slot, moved to first position; ItemList rebuilt with the new post at position 1; the Oct 19 to 25 card moved to the top of the MARKET UPDATES ARCHIVE.
- index.html slot 1, weekly.html, /market-update-latest redirects, sitemap.xml and llms.txt point at the new post.

### Blog hero intro line removed
- blog.html: removed the hero paragraph "Buying, selling, and living in ... real numbers, no spin." at Jonathan Wallace's request. Title and meta description unchanged.

### Tighter vertical spacing sitewide
Why: Jonathan Wallace asked for tighter margins on every page.
- styles.css: .section padding clamp(40px,6vw,80px) to clamp(28px,4vw,52px); .page-hero, .hero__inner, .hero--compact and .ctaband padding cut by about a third. ask.css hero and question page to match. hero--fold and guide-hero were already tight and are unchanged.

### Client names removed from the bottom disclaimer
Why: Jonathan Wallace asked to remove "Prepared for Terry and Carol Jeffries." from the bottom of the 188 Old Mill Road evaluation. The line at the top of the page stays.

### Sold comparables PDF is portrait letter size
Why: Jonathan Wallace wants the summary on 8.5 by 11 inch paper, vertical. sold-comparables.pdf is one portrait page. letter-and-sold-comparables.pdf is the letter, then that summary, both portrait. Download both still points at the combined file.

### Gold top edge on every comparable card
Why: Jonathan Wallace liked the gold lip on the For sale card and asked for the same on each sold card. Card size is unchanged.

### Disclaimer sits under Your Copies
Why: Jonathan Wallace asked for the information-purposes line below the four buttons, not above them. It also says this is not an appraisal and that it was prepared for Terry and Carol Jeffries.

### Slightly tighter space between evaluation sections
Why: Jonathan Wallace said the gap between the opinion, the gold buttons, and Sold felt too open. Section padding and the space between cards are a little smaller. The opinion stays centered, and the three gold buttons stay centered.

### Sold comparables PDF is a one-page summary
Why: Jonathan Wallace does not want the full listing photos in the PDF. sold-comparables.pdf is the one-page thumbnail grid. letter-and-sold-comparables.pdf is the letter plus that summary. The web page still has the photo walkthroughs.

### Photos for 188 Lodge Road
Why: Jonathan Wallace asked for the active listing to use the same 20-photo walkthrough as the sales. It stays marked for sale. No MLS number on the card.

### Top buttons are three equal gold links
Why: Jonathan Wallace replaced the Letter of Opinion heading and the mixed buttons with Join Weekly Newsletter, Who is Jonathan Wallace, and Recent Blog Posts. They are the same size, gold, and centered. The opinion text is centered too.

### Opinion of value is centered
Why: Jonathan Wallace asked for the charcoal opinion block to be centered. The spacing and the rest of the page stay as they are.

### Phone number listed once in the footer
Why: Jonathan Wallace wants his number shown once, on the "Prefer to call?" button.
- On the 28 pages whose footer has the "Prefer to call?" button (contact, weekly, the eval page, 23 listing pages and the listings index), the number is removed from the "Get in touch" list. Same change in scripts/build_newsletter_listings.py so rebuilt pages keep it. Footers without the button still list the number once in "Get in touch".

### Evaluation page cut down to the facts
Why: Jonathan Wallace asked for a simple page. The extra sentences, photo instructions, and repeated notes are gone. The opinion, the sales, the photos, the for-sale home, and the buttons stay.

### Disclaimer and prose use the full content width
Why: The old "What this is" block was a narrow column, so it ran long. That measure came from the listing disclosure style. On this page the disclaimer and the other short text blocks now span the content width, with less padding, so they sit shorter.

### Your Copies moved to the bottom
Why: Jonathan Wallace asked for the three downloads and Share with a friend under Your Copies at the bottom. A small newsletter pill sits under the Letter of Opinion heading at the top.

### Download both is one combined PDF
Why: Jonathan Wallace asked for one file that is the letter of opinion followed by the sold comparables. The button is labeled "Download both". The two separate downloads stay.

### Opinion block sits tighter
Why: Jonathan Wallace asked for less padding and less space between the lines in the charcoal opinion block. The words stay as they are.

### Evaluation page tightened, and the share note has no CC
Why: Jonathan Wallace asked for a shorter full-width opinion, no MLS numbers on the comparables, a plain "for information purposes only" line, and a share email with the November 5, 2026 letter date, the page link, and his REALTOR® sign-off. The share link does not CC anyone.

### Listing photos on the sold comparables
Why: Jonathan Wallace asked for up to 25 photos per sold on /eval/188-old-mill-road, shown at 16:9 and clickable. The saved listing set, and the comparables PDF, has 20 photos per sale. REALM shared links did not return more media, so each card uses those 20 and says so. The subject-property facts block stays off the page.

### Subject property facts removed from the evaluation page
Why: Jonathan Wallace asked to take the beds, baths, lot, frontage, PIN, and the rest of that block off /eval/188-old-mill-road. The opinion of value, the six sales, the active listing, and the download and share buttons stay.

### Sold comparables PDF is the multi-page photo set
Why: Jonathan Wallace replaced the one-page table with a summary plus a page of the first 20 listing photos for each of the six solds. The file path is unchanged. The letter of opinion and the page are unchanged.

### Evaluation page note removed
Why: Jonathan Wallace asked to remove the explanatory line under the download and share buttons on /eval/188-old-mill-road. The buttons stay.

### Sold comparables PDF swapped for the one-page table
Why: Jonathan Wallace rejected the dense card layout. The download at /eval/188-old-mill-road/sold-comparables.pdf is now the one-page table with a small photo on each row. The letter of opinion and the page layout are unchanged. The file URL is the same. Netlify sends max-age=0, must-revalidate, so the href does not need a cache-bust.

### Private home evaluation for 188 Old Mill Road, Port Severn
Why: Jonathan Wallace asked for a private page on jonathanwallace.ca for Terry and Carol Jeffries, so he can open a real site URL. It is a guinea pig for client evaluations, not a public page.
- /eval/188-old-mill-road is noindex, nofollow, and is not in the nav, sitemap.xml, or llms.txt. Pretty URL redirects match the listing pages. X-Robots-Tag covers the page and the PDFs.
- The Faris letterhead Letter of Opinion and the one-page Sold Comparables PDF are hosted in that folder. The comparables file is the densified one-pager with exterior photos (about 630 KB), not the earlier long PDF or the first one-page draft. Download links are root-relative so they work on the live site and on a deploy preview.
- Share opens an email draft with the live page URL in the body and CCs jonathan@faristeam.ca. The site does not send that email.

### Newsletter consent wording simplified (CASL v3)
Why: Jonathan Wallace asked to simplify the disclaimer under the sign-up box.
- On 101 forms the checkbox now reads "Yes, send me Jonathan Wallace's weekly Georgian Bay email. Unsubscribe anytime." The sender ID CASL requires (name, brokerage, mailing address, email) and the privacy link sit underneath in small type (.consent__fine). Phone number dropped from the line; one contact method is enough.
- consent_version is now casl-v3-2026-11-05 and the hidden consent_text matches the new wording, so new sign-ups record what they agreed to. Google one-tap consent unchanged.

### Straight Answers thumbnails re-cut from the opening frames
Why: Jonathan Wallace wants each thumbnail to show him smiling in the first frames, not mid-sentence.
- All eight posters in assets/img/ask/ re-cut fresh from the original videos at the first frame (rate hike video at the second frame). Card and video poster URLs carry ?v=2 so the 7-day image cache does not serve the old ones.

### Straight Answers: new video
- /ask/should-i-take-my-house-off-the-market-for-winter added (Selling). Built by scripts/build_ask.py; hub, homepage strip, sitemap.xml and llms.txt updated.

## 2026-11-03

### Friday email link removed from the footer
Why: Jonathan Wallace asked for it. The Weekly market hub link and the footer sign-up already lead to the Friday email, so two footer links were selling the same thing.
- assets/js/main.js no longer adds the /join link to footers. The top menu link stays.

### Straight Answers video library, preview only (PR branch ask-video-library-preview, not merged)
Why: Jonathan Wallace asked for a library of his unscripted question videos on the site, mocked up so he can refine the design, and not public until there are enough videos.
- content/ask-videos.json holds each video (question, short answer in his words, transcript from the audio). scripts/build_ask.py renders /ask/ (hub with topic filters), /ask/<slug> (video, short answer, CTA, full transcript, related questions) and a homepage strip above Home Tours.
- Media: assets/video/ask/*.mp4 (H.264 720x1280, converted from the iPhone HEVC originals, which some browsers will not play) and assets/img/ask/*.jpg posters.
- Schema ready for launch: VideoObject with transcript, FAQPage and Breadcrumb per page; CollectionPage plus ItemList on the hub.
- While "live" is false: noindex, not in sitemap.xml or llms.txt, not in the menu, and a gold preview bar on each /ask page. Launch = set live to true, rerun the script, add the pages to sitemap.xml and llms.txt.
- Uses Midnight Estate tokens, Playfair headlines, no gradients or shadows on cards (DEC-20261103-02).

### Breadcrumb schema on listing pages
- 12 indexable listing pages now carry BreadcrumbList (Home, Listings, address), matching the rest of the site (DEC-253).

### Batches 2 to 4 from the website council (structure only, no new wording beyond button labels already in use)
Why: Jonathan Wallace said "finish the job" on the council plan. Wording changes that need his approval are listed at the end and not made.
- Lead flow: on 66 posts the first call to action is now "Thinking of selling? Book a home evaluation" (Calendly in-home link, data-ga4 book_home_evaluation) instead of the newsletter button. The mid and end newsletter options stay.
- Gold "Book a home evaluation" bar under the hero on all five town hubs.
- Proof band, Daniel Landry's seller review and a matching town case study link now sit above the form on sell.html, the five sell pages and home-value.html.
- "Text me" (sms:+17054332525) added to the homepage hero and the sell page heroes. Homepage "Book a listing chat" and the sell-page footer booking buttons now go straight to contact.html#book. Homepage reviews lead with the seller review.
- Site map: 17 town posts now end with links to their town's sell page, interview page and hub; the Midland, Penetanguishene and Tiny hubs list their best posts; the five interview pages link their sell page, hub and proof posts; the homepage has a "Selling in a specific town?" row.
- /home-value.html is now two steps, modelled on /seller-valuation/: step 1 asks only address, town, name, email, mobile and consent and posts to the existing Netlify form home-valuation (organic tagging through the main.js beacon unchanged, Ads tag only on paid UTMs); step 2 is optional detail on a new Netlify form home-valuation-details, then thank-you.html (Google Ads conversion unchanged). No default "ASAP" or "1 bedroom" any more, here or on the sell-page forms.
- Speed: homepage hero now a 218 KB WebP (was a 363 KB JPG) and preloaded; images under /assets/img/ cached for 7 days (_headers). New branded 404.html (noindex) with the shared header, footer and next steps.

### Batch 1 from the website council (structure only, no wording changes)
Why: Jonathan Wallace asked for a six-seat council review (execution, marketing, lead flow, site architecture, SEO, AEO). Batch 1 fixes what was broken.
- Removed the self-serving aggregateRating and review markup from Jonathan Wallace's own RealEstateAgent/Person schema on 75 pages (DEC-252). The visible proof is unchanged.
- Added the three missing October market updates (Sep 28 to Oct 4, Oct 5 to 11, Oct 12 to 18) to blog.html cards and its ItemList (rebuilt from visible order), and Oct 5 to 25 to llms.txt.
- New scripts/check_site.py runs as the Netlify build command and stops a deploy if a post is missing from the sitemap, llms.txt or blog.html, the ItemList drifts from the cards, /market-update-latest is stale, JSON-LD fails to parse, a sitemap URL is noindex, own-entity aggregateRating returns, an em dash appears in copy, a redirect is duplicated, or 705-733-2525 appears.
- /sell-your-home-in-[town]/ (trailing slash) now 301s to the canonical URL. It used to serve the page without its stylesheet.
- sitemap.xml now lists each post at its canonical URL (12 corrected), and the non-canonical .html form of 9 extensionless-canonical posts 301s to the canonical.
- GA4: every data-cta link and every Calendly, call, text and button link now carries data-ga4 (430 links). Booking events: book_home_evaluation (in-home), book_phone_call. The interview-page eval bar keeps its existing event name book_evaluation (PR #109's note of book_home_evaluation was wrong).
- Removed a duplicate redirect block for /blog-which-agent-penetanguishene added earlier today.

### Fresh social cards for the big six banks post (v2)
Why: Jonathan Wallace rejected the gradient and drop shadow (DEC-20261103-02-no-gradient-no-shadow) and asked for a fresh render rather than edits of edits, which had degraded the photo.
- assets/img/social/blog-boc-big-six-banks-november-2026-4x5-v2.jpg and -9x16-v2.jpg, used by the Instagram and Facebook drafts in Buffer.

### Brand and SEO/AEO fix pass (sitewide audit, highest priority items)
Why: Jonathan Wallace asked for every page to be audited against the brand guidelines and the decision log, through the lens of ranking in AI search, then fixed highest priority first.
- Headlines: Source Serif 4 and Inter (never loaded, so headlines fell back to Georgia and system sans) replaced on about 70 pages: headings now Playfair Display, body and labels Nunito Sans (DEC-20261022-01). The 13 one-off template posts now load Playfair for their headlines. scripts/build_post.py labels switched from Inter to Nunito Sans so future market posts stay on brand.
- Pure white replaced with ivory #F7F3EC in styles.css, listing.css and page CSS (Midnight Estate kit).
- Blog card thumbnail moved off the top of 43 articles to below the intro (DEC-20261012-01). Still used for the blog index, og:image and Article schema.
- Bylines and JSON-LD job titles now read REALTOR® (DEC-20261022-02), about 124 pages.
- Em dashes removed from written copy: weekly market hub strip on 17 posts, vendor headers, case study details (DEC-20261021-13). llms.txt title and REALTOR® mentions fixed.
- Full name in furniture: footer "Email Jonathan Wallace", "From Jonathan Wallace:" callouts, restaurant picks heading; "tell him I sent you" in body (DEC-20261001-11, DEC-20260903-03).
- "my buyer email list" replaced with "an email list of active buyers" on sell.html and the five sell pages. "Charming" removed from the Penetanguishene hub intro.
- Footer h4 changed to p.footer__h on 211 pages, so headings run h1, h2, h3 for search and AI parsers. Same look.
- /blog-which-agent-penetanguishene (noindex duplicate) now 301s to the Penetanguishene interview page.
- Deleted the empty, indexable test-restore-check.html.
- scripts/publish.py no longer hardcodes its Make webhook (it reads JW_PUBLISH_HOOK). The old URL is still in git history and must be rotated in Make (DEC-124).
- Listing description wording left as is: it matches REALTOR.ca, which Jonathan Wallace confirmed is correct.
- Not changed, waiting on Jonathan Wallace: town-page FAQ rewrites (Needs Jonathan #35, drafts to follow), review count 15 vs 16 (DEC-254).
- Election town and candidate pages (89) are now noindex, follow and out of sitemap.xml, since the Oct 26 vote is over (Jonathan Wallace's call). The hub post stays indexed. build_election_2026.py writes and checks for this.
- The 16 one-off posts (13 blog posts, the Farlain spill post, the election results post, farlain-lake-high-water) now use the shared site header, footer, styles.css and main.js (DEC-150). Their own styles are scoped under .post-scope so they no longer touch the shared chrome; the old footer text stays as .post-foot.
- The five interview pages no longer open on the card image; it now sits below the answer block (DEC-20261012-01).
- Homepage hero proof sentence removed at Jonathan Wallace's request; the same figures are in the stats band directly below it.
- Structural check (DEC-263): tag balance, image count and JSON-LD parse compared before and after on every changed file, zero differences.

### Social images for the big six banks post
Why: Buffer needs public image URLs for the social drafts.
- assets/img/social/blog-boc-big-six-banks-november-2026-{linkedin (16:9), google (1200x675), 4x5, 9x16}.jpg. Correction: the drop-shadow approval (DEC-20261103-01) was logged in error and is void. DEC-20261103-02-no-gradient-no-shadow governs: no gradient and no drop shadow on cards.

### New blog post: Did the Bank of Canada Raise Rates Too Soon? What Canada's Big Six Banks Are Saying
Why: Jonathan Wallace asked for a balanced article on how the big six banks see the October 28 rate hike.
- /blog-bank-of-canada-rate-hike-big-six-banks-november-2026 with answer-first summary, "where each bank stands" box, FAQPage, Article (speakable, citations, mentions) and Breadcrumb schema, and links to each bank's published commentary.
- Card image assets/img/blog-bank-of-canada-rate-hike-big-six-banks-november-2026-card.jpg (Artlist, house styled after 835 Dominion Ave but not identical). Used on the blog index and social only, not as a header on the article.
- Added to blog.html (first card and ItemList), sitemap.xml and llms.txt.

### 67da723: new blog post: Canada's Economy Is Losing Steam
Why: Jonathan Wallace asked for an economy-focused post from the weekly Edge report (data restated in his words; Edge and its author are not named, per the report's sharing terms).
- /blog-canada-economy-losing-steam-november-2026 with answer-first summary, key takeaways, FAQPage, Article (speakable) and Breadcrumb schema. Added to blog.html, sitemap.xml and llms.txt.

### Planned (handed to Chief Of Staff, from the October Google stats review)
Why: Search Console October showed 51 clicks and 2.36K impressions. Tiny content (waterfront selling blog +12 clicks, Tiny hub +3) is driving growth. Midland and Penetanguishene don't appear in the top searches. GA4 (Oct 6 to Nov 2) showed 270 users (+84%), but average engagement fell to 50s (-56%), mostly from election traffic that leaves after one page. Google Business Profile had 0 calls in September.
1. Google Business Profile: check the phone number and the mobile Call button, add Q&A, and post weekly Google Posts naming Midland, Penetanguishene and Tiny.
2. Add the gold "Book a home evaluation" bar to the Tiny pages that already get search clicks (/blog-selling-waterfront-tiny-township.html, /tiny-township-real-estate/). Add a stronger next-step CTA to the election pages where most visitors leave (Penetang candidates 65%, election results 74%, wills post 71%).
3. Strengthen the Midland and Penetanguishene pages with recent sales proof and FAQs with schema, to match the Tiny pattern.
4. Make the homepage and about/contact titles and meta clearly match searches for "Jonathan Wallace REALTOR", including the misspelling "johnathan wallace", so those visitors land on contact.

### PR #110 (80ac0e5): interview and town pages back on brand
Why: Jonathan Wallace said the interview pages no longer looked on brand.
- The six "which real estate agent should you interview" pages (Tiny, Midland, Penetanguishene, Tay, Wasaga Beach, plus the noindex duplicate blog-which-agent-penetanguishene.html) were on a separate template with Nunito headlines, their own colours and no shared header or footer. They now use the shared layout, styles.css and Playfair headlines. Facts, FAQs and schema are unchanged.
- Added the gold "Book a home evaluation" bar above the article on every interview page.
- Fixed "REALTOR" missing the ® (Midland FAQ, Wasaga body copy) and a missing Penetanguishene hero image.
- On the Tiny, Tay and Penetanguishene town pages, the off-brand ivory inline proof card is now white text with a gold rule on the photo hero.

### PR #109 (5933dc5): gold booking bar on the Tiny interview page
Why: the page ranks number one, so visitors arriving from search should see a booking action before the content.
- Full-width gold #C9A96A bar with charcoal text, "Book a home evaluation", linking to https://calendly.com/jonathan-faristeam/jonathan-wallace-in-home-evaluation-full-cma
- Tracking: id/data-cta "book-home-evaluation", GA4 event book_home_evaluation, visible to Clarity.

## 2026-11-02
- PR #108 (be27df1): homepage hero gets Price my home, Current listings and Contact buttons plus the proof line. Mid-article /join links added on election pages and top posts. Tiny, Tay and Penetanguishene intros now name Jonathan Wallace (schema and llms.txt updated). Duplicate waterfront blog URLs 301 to the canonical .html. Clarity blocked on deploy previews. Why: Clarity showed almost no one got past the homepage first screen and 0 newsletter taps; AEO checks showed AI answers citing him less often.
- PR #107 (71dd4b0): 775 Ontario Street (S13706024) is off REALTOR.ca, so its page now redirects to the homepage. 22 active listing pages.

## 2026-10-30
- 639b066: Resources removed from the top menu sitewide at Jonathan Wallace's request. The footer link stays.
- c1e1a98: homepage hero subtitle and weekly market strip removed, and the hero made shorter.
- PR #105 (7119eb5): 193 Gouett price is now $779,900. 993 Whitney relisted as S14123950 at $914,900. Why: matching REALTOR.ca.

## 2026-10-29
- PR #102 (9d66f1c): Clarity technical fixes. Why: 30-day Clarity showed 8% of sessions with dead clicks, 20% quick backs, 6.9% JS errors and 0 visits to /join. Made whole cards clickable, enlarged the CTA close button to 44px and the nav toggle to 48px, added a JS error shield, improved INP, fixed the blog mobile hero, and added /join to the menu and footer. By Nov 2, quick backs were down to 3% and JS errors to 1%.
- PR #101 (ae82a2c): leftover listing prices updated to match the live pages (Champlain $1,149,900, 1555 Baseline $1,499,900).
