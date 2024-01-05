# Pull Request (PR) - Code Reviewer Practices

[Google Eng Practices Reference](https://google.github.io/eng-practices/review/reviewer/)

For developers, see [Developer Practices](developer.md).

**Tip: Use upper-left hamburger button to quickly see the Table of Contents and navigate the doc.**

**Tip: Click on the principle headings to get short links for quick reference.**

## Tools

<a name="pr-monitor"></a>

### [PR Monitor](#pr-monitor)

Install the Chrome extension for [PR Monitor](https://chrome.google.com/webstore/detail/pr-monitor/pneldbfhblmldbhmkolclpkijgnjcmng).

- Make sure it is **NOT** hidden in Chrome after installation, by [pinning the extension](https://www.howtogeek.com/683099/how-to-pin-and-unpin-extensions-from-the-chrome-toolbar/) using the Jigsaw Puzzle Piece icon.

<a name="goals"></a>

## [Goals](#goals)

### Improve code base over time

Keep code base healthy. Use continuous improvement to make it better.

**Rationale**: There is no perfect code, only better code.

### Make forward progress

Reviewers should allow developers to make forward progress on their tasks. Favor approving PRs that definitely improve overall code health, even if it isn't perfect. It is fine to ask for followup improvements or for tickets to be filed.

**Rationale**: Code that is never merged will never improve the codebase.

### Mentorship

Reviewers should feel free to leave comments that help developers learn something new. Mark educational comments with `Nit:`, or indicate that it's not mandatory to resolve in this PR.

<a name="principles"></a>

## [Principles](#principles)

### Technical facts and data overrule opinions and preferences

### Style guides dictate style.

[Style guides](style.md) should be considered the absolute authority on how to write something. Everything else is personal preference.

**Rationale**: The code base is a product of the organization, not of the individual contributors. Anyone should be able to contribute with ease to any part of the codebase because it follows the same patterns.

### Software design is a craft

Good software rarely is purely style nor just personal preference. Standard software design and engineering principles should underlie all decisions. Sometimes tradeoffs need to be made when there's a few valid options.

**Rationale**: Maintaining an organization's code base requires a balance of good engineering principles, and ease of use.

<a name="steps"></a>

## [Code Review Steps](#steps)

### Look broadly at change

- Does PR Description and PR content make sense to even do?
  - Immediate feedback on why this doesn't make sense and provide alternatives.

### Examine main parts of PR, in phases from large to small

Look over PR in passes, in order from largest to smallest details. Don't waste time on nitpicking small parts of PR if larger parts first need work.

**Rationale**: Higher level feedback often takes longer to rework, and details don't matter until underlying fundamentals make sense.

#### Suggested order:

See [Things to look for](#look-for) section for more details.

- Too large PR?
  - Immediately ask to [split PR into smaller chunks](developer.md#small-pr).
- Design problems?
  - Immediate feedback if not right
    - **Rationale**: Author needs time to re-work design earlier
- Data structures make sense?
  - **Rationale**: Encodes all state. If anything in state is not immediately clear, operating code won't be clear.
- APIs look easy to use?
  - **Rationale**: APIs are long-term contracts, with high maintenance cost. Example client code can help determine how hard the API is to use.
- Handling of data structures?
  - **Rationale**: All operations on data structures should have clear and reasonable transitions.
- Tests?
  - **Rationale**: The tests should be clear clients of the code. If the tests look convoluted, there's high likelihood of design problems with the PR, and may need rework.
- Edge cases?
  - **Rationale**: Check for edge cases that come to mind after reading the PR description, to see how developer has handled it. If the edge cases were not handled, there's a possibility the PR may need rework.

<a name="comments"></a>

## [Writing Comments](#comments)

### Courtesy

Comment on the code, not the developer.

**Rationale**: Code is the product, and the subject of code review. We are trying to get to good code. Developers are humans. Treat the humans nicely.

### Explain why

Help the developer understand why you're making the suggestion, so they can improve over time.

### Give guidance

The developer has the ultimate responsibility to fix the PR, rather than the reviewer.

Strategies for guidance

- Point out problems and let developer decide how to handle the fix ("teach fishing")
  - Developers learn over time to make better PRs.
- Direct instructions, suggestions, and code ("give fish")
  - Short term way to get to best PR for now.

### Acceptable Explanations

Reviewer questions should generally be answered with clearer code.

**Rationale**: The goal of good code is to answer questions. Explanations in a code review tool do not help future code maintainers. Adding a comment in code is appropriate only if it's not explaining unnecessarily complex code.

**Exception**: Explaining something that normal code readers would already know.

<a name="look-for">

## [Things to look for](#look-for)

Following are examples of questions to ask in various aspects of the PR. See subsections for in-depth examples of questions.

- The code is well-designed.
- The functionality is good for the users of the code.
- Any UI changes are sensible and look good.
- Any parallel programming is done safely.
- The code isn't more complex than it needs to be.
- The developer isn't implementing things they _might_ need in the future but
  don't know they need now.
- Code has appropriate unit tests.
- Tests are well-designed.
- The developer used clear names for everything.
- Comments are clear and useful, and mostly explain _why_ instead of _what_.
- Code is appropriately documented (`README`s, etc).
- The code conforms to our style guides.
- Migrations conform to the [migration guidelines](https://github.com/*company-data-covered*/services/blob/trunk/sql/README.md#migrations).

<a name="look-for-design"></a>

### [Design](#look-for-design)

TODO: Add examples.

- Code Interactions?
- Inside codebase vs library?
- Integration with rest of system?
- Right timing for adding functionality

<a name="#look-for-functionality"></a>

### [Functionality](#look-for-functionality)

- Code does what PR description claims?
- Author tested functionality sufficiently?
- Edge cases? Concurrency issues?
- Screenshots?
- Can client code use this functionality easily?

<a name="#look-for-complexity"></a>

### [Complexity](#look-for-complexity)

Complexity at every level of PR should be kept to minimum.

- Classes?
- Functions?
- Individual lines?

"Too complex" means:

- Can it be understood quickly by code readers with minimal context?
  - `delay` is a bad name, hard to tell units without reading other code.
  - See [Naming](style.md#naming) for more guidance
- Will developers likely introduce bugs when calling/modifying code?

Only solve the problem you need to solve now, not the theoretical one.

- Not over-engineered? Too generic?

<a name="#look-for-tests"></a>

### [Tests](#look-for-tests)

Appropriate levels of tests should be added in same PR as production functionality.

- Correct, sensible, useful?
- Fails when broken?
- Easy to debug when broken?
- Brittle when code under test changes?
- Simple and useful assertions?
- Not too complex?

**Exception**: Emergencies do not require tests immediately.

<a name="#look-for-naming"></a>

### [Naming](#look-for-naming)

See Code Style Guide for [tips on naming](style.md#naming).

- Good, consistent names for everything?
- Fully communicate item's use without being too long?

<a name="#look-for-comments"></a>

### [Comments](#look-for-comments)

Comments should be kept to a minimum. See Code Style Guide for [more guidance](style.md#obviously-right).

- Are comments necessary?
  - Make code simpler to remove need for comments?
- Understandable English?
- Everything spelled right?
- Explain the why, not the how?
- Removed unneeded comments like old TODOs.

<a name="#look-for-style"></a>

### [Style](#look-for-style)

- Does code follow language style guides?
- Use `Nit:` to mark optional preferences that are not mandatory
- Separate major style changes into separate PR from other changes.

<a name="#look-for-consistency"></a>

### [Consistency](#look-for-consistency)

- Follows [Coding Style Guide](style.md)?
- Maintains consistency with existing code?
- File bugs/`TODO`s for cleanup of existing code?

<a name="#look-for-documentation"></a>

### [Documentation](#look-for-documentation)

- Missing docs?
- Updates related `README`s and generated docs?
- Deleted code has deleted docs?

<a name="#look-for-every-line"></a>

### [Every line](#look-for-every-line)

Reviewer is responsible for **understanding every line** of code in a PR. When a reviewer cannot understand the code, ask for clarification from the author.

- Look at every line of code
  - Read
    - Human written
    - Large data structures
      - Should it be broken up?
  - Scan
    - Data files
    - Generated code
- Add reviewers for parts where you feel unqualified

**Exceptions**:

Author/another reviewer asks for review on:

- Certain files
- Certain aspects
  - High level design
  - Security

Note in comments which part of PR was reviewed, giving Approvals _with comments_.

If you will only give LGTM after others have reviewed, explicitly write that in comments, to set expectations.

<a name="#look-for-context"></a>

### [Context](#look-for-context)

Look beyond the few lines of code in the PR.

- Fits within context of file?
- Makes sense in larger system?
- Adds unnecessary complexity?
- Improves code health overall?
  - **DO NOT ALLOW degration of overall code health without explicit followup commitment.**

<a name="#look-for-good-things"></a>

### [Good things](#look-for-good-things)

Offer encouraging words when you see something good. Tell developers **what they did right**.

<a name="speed"></a>

## [Speed](#speed)

Code reviews should be prioritized for fast response times. The organization is optimizing for speed of the team producing a product, not an individual.

Fast response times do not mean cursory reviews that cut corners. Use multiple passes if you do not have time to do thorough review immediately.

### Cons of slow code reviews

- Team velocity decreases
  - **Rationale**: Reviewers who don't respond quickly may get their own work done, but teams as a whole get delayed.
- Developers protest code review process
  - **Rationale**: Developers become frustrated when major changes are requested, with severe latency. Most complaints about code review disappear with speed.
- Code health impacted
  - **Rationale**: Slow reviews create more pressure to ship poor quality code, discouraging cleanup, reafactoring, and other improvements.

<a name="fast"></a>

### [Fast as possible](#fast)

Do reviews as often as you're not on a focused task.

- If too busy to give full review, give a quick response as to when you will get to it, or who should do it instead.

<a name="1-day"></a>

- [**Max 1-day turnaround**](#1-day)

  1 business day turnaround maximum. If all other rules fail, this is the golden rule. This accounts for cross timezone reviews.

### No interruptions

Focused tasks should continue. Do not interrupt for reviews. But do code reviews after breaks (lunch, meeting, etc).

- **Rationale**: Regaining focus after losing it can cost developers a lot of extra time, which is expensive for the team as a whole. Asking another developer to wait a bit more time is a reasonable trade-off.

- **Corollary**: Do not interrupt people synchronously to ask for code reviews unless it's an **emergency or unreasonably overdue**. This includes in team chat channels. They may be doing focused work.

### Cross timezone reviews

Try to do reviews while the developer is in the office. Or else before they come in the next morning.

<a name="optimistic-approvals"></a>

### [Optimistic approvals](#optimistic-approvals)

Speed up code reviews by optimistically approving code reviews with comments, even when there are unresolved cases if:

- Reviewer is confident developer will appropriately address comments
- Remaining changes are minor and don't _have_ to be done by the developer

Reviewer should specify which of these cases they intend in comments while giving approval. This is especially important across timezones.

### Too large PR

[Push back immediately](developer.md#small-pr)

<a name="emergencies"></a>

## [Emergencies](#emergencies)

Some emergencies require passing the code review process quickly.

In this case **only**, prioritize speed of review and correctness. These reviews take priority over all other reviews.

Post emergency, review the PRs more thoroughly.

Examples:

- Emergencies:
  - Pressing legal issue
  - Close major security hole
  - Fix bug significantly affecting users in production
- Not emergencies:
  - Launch this week instead of next week
    - Exceptions: hard deadlines like partner agreement/contracts
  - Developer wants something in because they worked a long time on it
  - Reviewers are away
  - End of day
  - Manager says there's some arbitrary soft deadline
  - Rolling back PR that is causing test failures or build breakages

<a name="conflicts"></a>

## [Resolving conflicts](#conflicts)

1. Developer and reviewer should try to reach consensus using these [reviewer](#) and [developer](developer.md) docs.

2. Use face-to-face meeting or video conference to talk through issues. Record all resolutions in code review tool, for future readers

3. **Last resort**: Escalate to broader team discussion, or bring in a Tech Lead/Manager if necessary.
