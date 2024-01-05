# Coding style guidelines

Per-language style guides:

- Ruby - [Rubocop style guide](https://rubystyle.guide/)
- Elixir - [Elixir style guide](https://github.com/christopheradams/elixir_style_guide)
- Terraform - [Terraform style guide](./terraform-style-guide.md)

## Overview

This guide is written in the spirit of [Google Style Guides](https://github.com/google/styleguide), especially the most well written ones like for [Obj-C](https://github.com/google/styleguide/blob/gh-pages/objcguide.md).

Coding style guides are meant to help everyone who contributes to a project to forget about how code feels and easily understand the logic.

These are guidelines with rationales for all rules. If the rationale doesn't apply, or changes make the rationale moot, the guidelines can safely be ignored.

**Tip: Click on the principle headings to get short links for code review reference.**

## General Principles

<a name="consistency"></a>

### <a class="anchor" href="#consistency">Consistency is king</a>

Above all other principles, be consistent.

If a single file all follows one convention, just keep following the convention. Separate style changes from logic changes.

**Rationale**: If same thing is named differently (`Apple`, `a`, `fruit`, `redThing`), it becomes hard to understand how they're related.

<a name="readability"></a>

### <a href="#readability">Readability above efficiency</a>

Prefer readable code over fewer lines of cryptic code.

**Rationale**: Code will be read many more times than it will be written, by different people. Different people includes you, only a year from now.

<a name="obviously-right"></a>

### <a href="#obviously-right">All code is either obviously right, or non-obviously wrong.</a>

Almost all code should strive to be obviously right at first glance. It shouldn't strike readers as "somewhat odd", and need detailed study to read and decipher.

**Rationale**: If code is obviously right, it's probably right. The goal is to have suspicious code look suspiciously wrong and stick out like a sore thumb. This happens when everything else is very clear, and there's a tricky bit that needs to be worked on.

_Corollary_: Code comments are a sign that the code isn't particularly well explained via the code itself. Either through naming, or ordering, or chunking of the logic. Both code and comments have maintenance cost, but comments don't explicitly do work, and often go out of sync with associated code.
While not explicitly disallowed, strive to make code require almost no comments.

Good cases to use comments include describing **why** the code is written that way (if naming, ordering, scoping, etc doesn't work) or explaining details which couldn't be easily explained in code (e.g., which algorithm/pattern/approach is used and why).

_Exception_: API interfaces _should_ be commented, as close to code as possible for keeping up to date easily.

**Further Reading**: https://www.joelonsoftware.com/2005/05/11/making-wrong-code-look-wrong/

<a name="boring"></a>

### <a href="#boring">Boring is best</a>

Make your code the most boring version it could be.

**Rationale**: While you may have won competitions in code golf, the goal of production code is NOT to have the smartest code that only geniuses can figure out, but that which can easily be maintained. On the other hand, devote your creativity to making interesting test cases with fun constant values.

<a name="split-implementation"></a>

### <a href="#split-implementation">Split implementation from interface</a>

Storage, presentation, communication protocols should always be separate.

**Rationale**: While the content may coincidentally look the same, all these layers have different uses. If you tie things in the wrong place, then you will break unintentionally in non-obvious bad ways.

Example:

```js
// Storage protocol (on-disk)
{
  first_name: 'Joe',
  last_name: 'Schmoe',
  last_visit_timestamp: 12345,
}

// Communication protocol (client->server)
{
  firstName: 'Joe',
  lastName: 'Schmoe',
}

// Presentation protocol, used for displaying on a UI (server->client)
{
  displayName: 'Schmoe, Joe',
  shortDisplayName: 'J. Schmoe',
  firstName: 'Joe',
  lastName: 'Schmoe',
}
```

<a name="separate-policy"></a>

### <a href="#separate-policy">Split "policy" and "mechanics"</a>

Always separate the configuration/policy ("the why") from the implementation/mechanics ("the how").

**Rationale**: You can test the implementation of what needs to be done. You can also test the policy triggers at the right time. Turning a feature on and off makes it much easier to throw in more features and later turn them on/off and canary.

**Corollary**: Create separate functions for "doing" and for "choosing when to do".

**Corollary**: Create flags for all implementation features.

# Deficiency Documentation (`TODO`s and `FIXME`s)

<a name="todo"></a>

### <a href="#todo">`TODO` comments</a>

Use `TODO` comments _liberally_ to describe anything that is potentially missing.

Code reviewers can also liberally ask for adding `TODO`s to different places.

Format:

```js
// TODO(Context): <Action> by/when <Deadline Condition>
```

`TODO` comments should have these parts:

- **Context** - JIRA issue, etc. that can describe what this thing means better.
  - Issues or other documentation should be used when the explanations are pretty long or involved.
  - Code reviewers should verify that important `TODO`s have filed JIRA Issues.
  - Examples:
    - `CARE-XXX` - Issue description
- **Action** - Very specific actionable thing to be done. Explanations can come after the particular action.
  - Examples:
    - `Refactor into single class...`
    - `Add ability to query Grafana...`
    - `Replace this hack with <description> ...`
- **Deadline Condition** - (_Optional_) when to get the thing done by.
  - Deadline Conditions should **NOT** be relied on to _track_ something done by a time or milestone. Use JIRA or other bug tracking tool.
  - Examples:
    - `... before General Availability release.`
    - `... when we add <specific> capability.`
    - `... when XXX bug/feature is fixed.`
    - `... once <person> approves of <specific thing>.`
    - `... when first customer asks for it.`
    - Empty case implies "`...when we get time`". Use _only_ for relatively unimportant things.

**Rationale**: `TODO` comments help readers understand what is missing. Sometimes you know what you're doing is not the best it could be, but is good enough. That's fine. Just explain how it can be improved.

Feel free to add `TODO` comments as you edit code and read other code that you interact with.

Good Examples:

```js
// TODO(CARE-XXX): Replace old logic with new logic when out of experimental mode.

// TODO(SCIENCE-XXX): Colonize new planets when we get cold fusion capability.
```

Mediocre examples(lacks Deadline Condition) - Good for documenting, but not as important:

```js
// TODO: Add precompiling templates here if we need it.

// TODO: Remove use of bash.

// TODO: Clean up for GetPatient/GetCaseWorker, which might be called from http handlers separately.

// TODO: Figure out how to launch spaceships instead of rubber duckies.
```

Bad examples:

```js
// TODO: wtf? (what are we f'ing about?)

// TODO: We shouldn't do this. (doesn't say what to do instead, or why it exists)

// TODO: err...
```

<a name="fixme"></a>

### <a href="#fixme">`FIXME` comments</a>

Use `FIXME` comments as **stronger** `TODO`s that **MUST** be done before code submission. These comments are **merge-blocking**.

`FIXME` should be liberally used for notes during development, either for developer or reviewers, to remind and prompt discussion. Remove these comments by fixing them before submitting code.

During code review, reviewer _may_ suggest converting `FIXME` -> `TODO`, if it's not important to get done before getting something submitted. Then [`TODO` comment](#todo-comments) formatting applies.

Format (same as [`TODO` comments](#todo-comments), but more relaxed):

```js
// FIXME: <Action or any note to self/reviewer>

// FIXME: Remove hack

// FIXME: Revert hardcoding of server URL

// FIXME: Implement function

// FIXME: Refactor these usages across codebase. <Reviewer can upgrade to TODO w/ JIRA ticket during review>

// FIXME: Why does this work this way? <Reviewer should help out here with getting something more understandable>
```

**Rationale**: These are great self-reminders as you code that you haven't finished something, like stubbed out functions, unimplemented parts, etc. The reviewer can also see the `FIXME`s to eye potential problems, and help out things that are not understandable, suggesting better fixes.

# Code

<a name="naming"></a>

## <a href="#naming">Naming</a>

<a name="semantic-naming"></a>

### <a href="#semantic-naming">Variables should always be named semantically.</a>

Names of variables should reflect their content and intent. Try to pick very specific names. Avoid adding parts that don't add any context to the name. Use only well-known abbreviations, otherwise, don't shorten the name in order to save a couple of symbols.

```js
// Bad
input = "123-4567"
...
dialPhoneNumber(input) // unclear whether this makes semantic sense.

// Good
phoneNumber = "123-4567"
...
dialPhoneNumber(phoneNumber) // more obvious that this is intentional.

// Bad
number = 1234
...
address = "http://some-address/patient/" + number  // why is number being added to a string?

// Good
patientId = 1234
...
address = "http://some-address/patient/" + patientId // ah, a patient id is added to an address.
```

**Rationale**: Good semantic names make bugs obvious and expresses intention, without needing lots of comments.

<a name="naming-units"></a>

### <a href="#naming-units">Always add units for measures.</a>

Time is especially ambiguous.

Time intervals (duration): `timeoutSec`, `timeoutMs`, `refreshIntervalHours`

Timestamp (specific instant in time): `startTimestamp`. (Use language-provided representations once inside code, rather than generic `number`, `int` for raw timestamps. JS/Java: `Date`, Ruby/Elixir: `DateTime`, Go: `time.Time`, Python: `datetime.date/time`)

Distances: `LengthFt`, `LengthMeter`, `LengthCm`, `LengthMm`

Computer Space: `DiskMib` (1 Mebibyte is 1024 Kibibytes), `RamMb` (1 Megabyte is 1000 Kilobytes)

```js
// Bad
Cost = DiskMib * 1024 * Cents;

// Good
CostCents = DiskMib * 1024 * CentsPerKilobyte;
```

**Rationale**: Large classes of bugs are avoided when you name everything with units.

<a name="constants"></a>

## <a href="#constants">Constants</a>

<a name="constant-literals"></a>

### <a href="#constant-literals">All literals should be assigned to constants (or constant-like treatments).</a>

Every string or numeric literal needs to be assigned to a constant, either in a global or local context.

**Exceptions**: Identity-type zero/one values: `0`, `1`, `-1`, `""`

```js
// Bad
login('abc', '123');
checkForPulse(30, 120);
sleep(120000);

// Good
user = 'abc';
password = '123';
login(user, password);

minPulseBPM = 30;
checkDurationSec = 2 * 60;
checkForHeartbeat(minPulseBPM, checkDurationSec);
sleep(checkDurationSec * 1000);
```

**Rationale**: It is never obvious why random number or string literals appear, or whether they're used correctly. Even if they are somewhat obvious, it's hard to debug/find random literals and what they mean unless they are explicitly defined. Looking at named constants allows the reader to see what is important, and see tricky edge cases while spelunking through the rest of the code.

<a name="tests"></a>

# <a href="#tests">Tests</a>

All commentary in the Code section applies here as well, with a few relaxations.

<a name="repetitive-test-code"></a>

### <a href="#repetitive-test-code">Repetitive test code allowed</a>

In general, do not repeat yourself. However, IF the test code is clearer, it's ok to repeat.

**Rationale**: Readability above all else. Sometimes tests are meant to test lots of niggling nefarious code, so we make exceptions for those cases.

<a name="small-test-cases"></a>

### <a href="#small-test-cases">Small Test Cases</a>

Make test cases as small and targeted as possible.

**Rationale**: Large tests are both unwieldy to write, and hard to debug. If something takes lots of setup, it's usually a sign of a design problem with the thing you're testing. Try breaking up the code/class/object into more manageable pieces.

<a name="no-complex-test-logic"></a>

### <a href="#no-complex-test-logic">No complex logic</a>

Avoid adding complex logic to test cases. It's more likely to have a bug in this case, while the purpose of the test cases is to prevent bugs. It's better to [repeat](#repetitive-test-code-allowed) or use a helper function covered with test cases.

**Rationale**: Complex test logic often implies that the design/architecture of the underlying code is not well thought out.

<a name="test-creativity"></a>

### <a href="#test-creativity">Be creative in the content</a>

Just as for regular code, name variables for how they will be used. Intent is unclear when placeholders litter the code.

Use creative values for testing that don't look too "normal", so maintainers can tell values are obviously test values.

```js
// Bad
login("abc", "badpassword") // Are "abc" and "badpassword" important?
memberId = "NA12312412" // Looks too "real", and unclear if it needs to follow this form

// Good
memberId = "some random member id"
name = "abc"
goodPassword = "open sesame"
badPassword = "really bad password! stop it!"
...
login(name, goodPassword) // Success
login(name, badPassword) // Failure
```

**Rationale**: Having unique test content helps debugging when failures appear.

<a name="spooky-action"></a>

### <a href="#spooky-action">No "spooky action at a distance"</a>

Collect all related logic/conditions into a single place, so it's easy to grasp how the different parts are related.

```js
// Bad
startingInvestmentDollars = 100;
invest();
... lots of test code ...
invest();
loseMoney();
expect(investment == 167); // Why 167?

// Good
startingInvestmentDollars = 100;
returnInterestRatePercent = 67;
endingInvestmentDollars = 167; // More obvious where 167 comes from.
... lots of test code ...
expect(investment == endingInvestmentDollars);
```

**Rationale**: When all related things are collected in a single place, you can more clearly understand what you think you'll read. The rest is just checking for mechanics.
