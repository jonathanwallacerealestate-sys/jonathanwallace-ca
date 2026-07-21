# Repurposing plan: one home tour, three assets

For every new YouTube home tour, spin out three things: an Instagram Reel caption, a
Google Business post, and a short email to the list. Reusable templates below. Merge
fields are in double braces. Keep brand voice: no em dashes, the name in full, sensory
and concrete, none of the banned words.

Merge fields: {{address}}, {{community}}, {{price}}, {{beds}}, {{baths}}, {{hook_detail}},
{{video_url}}, {{first_name}}.

The hook_detail is one true, specific line about the home (steps to Penetang Bay, a
walk-out to the water, a workshop off the garage). Specific beats generic every time.

## 1. Instagram Reel caption
Inside {{address}} in {{community}}. {{hook_detail}} The full walk-through is on YouTube,
link in bio. If Georgian Bay is on your mind, this is the easiest way to see what living
here is really like.
{{price}}, {{beds}} bed, {{baths}} bath.
Questions on this one, or thinking of selling yours? Send me a message.
#GeorgianBay #Midland #Penetanguishene #FarisTeam #HomeTour

## 2. Google Business post
New Georgian Bay home tour: {{address}} in {{community}}. {{hook_detail}} Watch the full
walk-through on YouTube and see what it is really like to live here. Thinking of buying or
selling on Georgian Bay? I am happy to help, no pressure.
Button: Watch the tour. Link: {{video_url}}

## 3. Email to the list
Subject: New Georgian Bay home tour in {{community}}
Hi {{first_name}},
I just posted a new home tour: {{address}} in {{community}}. {{hook_detail}}
It is {{price}}, {{beds}} bed and {{baths}} bath. I walk through the whole place on camera
so you can see what it is really like, not just the photos.
Watch the tour here: {{video_url}}
If you want to see it in person, or you are weighing a move of your own, just reply and we
will find a time.
Talk soon,
Jonathan Wallace
Faris Team Real Estate, Brokerage
705-433-2525

## How this gets made
See the optional Make automation (documented in the PR): when a new video posts to
@jonathanwallaceRE, the scenario drafts these three assets into a Google Doc for your
review. Nothing publishes automatically. The scenario reads content/brand-voice.md so the
drafts already follow these rules.
