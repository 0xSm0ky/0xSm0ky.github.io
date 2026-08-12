---
title: "Notes on Experiment!: Website Conversion Rate Optimization"
description: Key takeaways on A/B testing, UX, and persuasion from Colin McFarland's book on experimentation.
date: 2026-08-10
lang: en
draft: false
tags: ["ab-testing", "ux", "book"]
---

Some notes I took while reading *Experiment! Website Conversion Rate Optimization with A/B and Multivariate Testing*. It's less a testing-tool manual and more a mindset shift: experimentation as a culture, not a checklist.

## On Experimenting

An experiment is a way of gathering information to compare an idea against reality. As long as your hypothesis is clear and you know what you're trying to achieve, you can test almost anything, so start with the obvious things and get moving.

There's really only one guideline: **experiment**. It's tempting to copy other companies' case studies hoping for a quick win, but take them lightly; you rarely see the full picture, and you have no way of knowing how rigorous their experiment actually was. Learn from their hypotheses and goals instead of imitating their methods blindly. You have to run your own experiments and find out, for your own business and customers, what actually works.

Steve Krug said it best: *don't make me think*. A site that's easy to use and provides a good experience is a site that converts. Talk to customers like the emotional human beings they are: communicate clearly through design (where am I, where can I go, what's happening) and through language (clear, active words, no jargon).

A couple of ideas worth keeping in mind:

- Sheena Iyengar's research (*The Art of Choosing*) shows that too much choice can paralyze decision-making rather than help it.
- Robert Cialdini's six principles of persuasion (*Influence*): **scarcity**, **social proof**, **liking**, **authority**, **commitment/consistency**, and **reciprocation**.

Optimizing UX is the easy part; understanding persuasion is what actually uncovers why people buy. No design is neutral, and every design choice is a trade-off; you can't test everything, so be deliberate about which experiments are worth running. Be brave enough to fail, and treat a losing challenger as a lesson rather than a setback.

## On Approach

Ship experiments fast and often: the more you ship, the more you learn, the more you win. Anything that slows that cycle down is costing you. There's no time for the *perfect* experiment; aim for *enough* to ship it, then discover and improve from there.

A few operating principles:

- Focus on changes that affect many customers: that's where the big opportunities are.
- **Edge cases must die.** Aim for completeness, but if getting something right for a small slice of users is delaying the experiment, exclude the edge case, ship, prove the value, then circle back for housekeeping.
- Experiment maturity is the point where every change becomes measurable through an experiment; you're designing experiments, not just designing things stakeholders want.
- Go for low-hanging fruit first. An early win puts experimentation on the map and earns buy-in.
- There's no perfect experimentation program. Even eBay, Amazon, Google, Etsy, and Netflix can't test everything: the goal is a culture of continuous improvement, not a finished state.
- Always think one wave ahead. While you're running wave 1, be planning wave 2.
- Don't let old wins become sacred cows. If it ain't broke, break it: either you learn something new, or you gain more confidence in what you already have.
- You can always undo a "winning" experiment by reverse-testing it against the old control.

Making experimentation a way of life means thinking, every day, about what you can test, how to do it better, and why something passed or failed, and never letting your tools, processes, or team get in the way of that habit. Every experiment is just a new starting point; it's never finished.

## On Method

**When do experiments end?** Technically, never (but practically, you can use your expected lift, current site performance, and number of variations to estimate how long it will take to reach confident results). Use a duration calculator as a guide, and avoid running experiments that will simply take too long to resolve.

Some practical rules:

- Run experiments at full traffic (100%) to get results faster.
- Use traffic ramp-up only to build stakeholder buy-in for sensitive experiments: remember, ramp-up means a longer experiment duration, and you can't combine measurements across periods with different traffic conditions.
- Fake a feature first to prove its value before building it properly.
- Learn what a feature is actually worth by temporarily taking it away.
- Pick the testing tool that matches your needs and maturity stage: the tool is just a vehicle. It won't produce winners on its own; you still have to design and run good experiments.

## On UX

Simple trumps complete. Problems arise when "best practices" get treated as no-brainers and implemented without further thought (after all, if everyone else does it, it must be right...) except it's rarely that simple. The only way to know whether something is genuinely the best design, or just better than what you had before, is to break it and try something else. Make no assumptions, and mind the gap between what customers *say* and what they actually *do*.

## On Design

There's no point designing solutions to problems that don't exist. Experiments help you focus on the areas of the site that actually make money, and if you don't know *why* a change is better, your customers won't either.

Scott Berkun's *The Myths of Innovation* calls out the go-to phrases people use to kill an idea without offering any real criticism:

- "We tried that already."
- "We've never done that before."
- "That never works."
- "People won't like it."
- "It's out of scope / not in our budget."

The fix is simple: present ideas as experiments, complete with a hypothesis, a goal, and a test plan. A plan is much harder to dismiss on opinion alone than a bare idea is.

## On Ideas

Look at the areas of the site that most influence customers, then develop ideas to push them further. When cataloguing usability problems, Jeff Sauro's approach is useful; give each one a name, a description, and a severity rating:

1. Prevents task completion
2. Causes significant delay or frustration
3. Minor impact on frustration
4. Just a suggestion

Keep a knowledge base of experiment data, results, and learnings: future ideas often come from reviewing old ones. Mine qualitative sources too: exit surveys, satisfaction scores, even call-centre recordings.

Eventually you'll hit a point where the current experience feels "optimized" and wins get harder to find. That's the line between **optimization** (improving what exists) and **innovation** (trying something genuinely new that data alone can't validate). When you want to innovate, following hunches matters: as Steve Jobs put it, creativity is just connecting things, and the more you experiment, the more raw material you have to connect.

Write ideas down. Build a running collection of results, discoveries, and half-formed thoughts; an idea that didn't make sense on its own often clicks once it's connected to something new.

## On Analysis

- Make sure results aren't attributable to random chance, and check how much variance there is.
- Watch for atypical external conditions that could have skewed the data.
- Segment results to learn what worked and to surface new experiment ideas.
- Stay focused on the KPIs you defined up front: don't go swimming in data.
- Remember that customers aren't the only traffic on your site; clean out non-normal traffic before drawing conclusions.
- Consider timing from both the customer's and the business's perspective.

## On Results

- "No difference" means *worse*: ship only winners.
- An unexpected positive result is worth testing again to confirm.
- Sometimes you'll have to release a small negative for the sake of a bigger win elsewhere.
- Take advantage of the iterative nature of experimentation: start planning the next wave immediately, and reuse code, assets, and learnings wherever you can.
- Share and promote experiment results *internally* to build engagement and maturity. But think carefully before sharing them externally. Your experiment results are one of your most valuable competitive assets.

## Recommended Reading

A shortlist from the book's own reading list, on persuasion, decision-making, and analytics:

- **Influence: The Psychology of Persuasion**, Robert B. Cialdini
- **Don't Make Me Think**, Steve Krug
- **Predictably Irrational**, Dan Ariely
- **Nudge**, Richard H. Thaler & Cass R. Sunstein
- **How We Decide**, Jonah Lehrer
- **The Wisdom of Crowds**, James Surowiecki
- **The Myths of Innovation**, Scott Berkun
- **Web Analytics: An Hour a Day**, Avinash Kaushik
- **How to Lie with Statistics**, Darrell Huff

Also worth digging up: Ron Kohavi's papers and talks on experimentation at Microsoft: required reading for anyone building a testing culture.
