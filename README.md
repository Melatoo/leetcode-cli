<div align="center">
  
# 🚀 LeetCode CLI Generator

**Automate your LeetCode grind with a single command!**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 📌 What is it?

**LeetCode CLI Generator** is a fast, lightweight command-line tool that automatically sets up your environment for any LeetCode problem. Instead of manually copying descriptions and boilerplate code, just pass the problem ID and let the CLI do the heavy lifting!

It connects directly to the **LeetCode GraphQL API**, fetches the problem data, and generates a structured, ready-to-code folder for you.

## ✨ Features

- ⚡ **Instant Setup**: Generates your workspace in seconds.
- 📖 **Markdown Descriptions**: Automatically fetches the problem description and converts it to a clean `.md` file using `turndown`.
- 💻 **Smart Code Extraction**: Downloads the exact JavaScript starting snippet for the problem.
- 🧠 **Auto-Export Detection**: Intelligently ignores commented helper structures (like `ListNode`) and finds the correct function to `module.exports` for easy local testing.
- 🧪 **Built-in Local Testing**: Run `leetcode-test` to automatically fetch examples from LeetCode and test your solution locally against them.
- 📂 **Organized Structure**: Pads folder names (e.g., `0001`, `0002`) so your repository stays neatly sorted!

## ⚙️ Installation

To use this CLI globally on your machine, clone this repository and link it using npm:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/leetcode-cli.git
cd leetcode-cli

# 2. Install dependencies
npm install

# 3. Link globally
npm link
```

## 🚀 Usage

Once installed, simply run the command followed by the LeetCode problem ID:

```bash
leetcode-gen 1
```

### Output Example

The tool will process the problem and generate a beautifully organized folder:

```text
📁 0001/
 ├── 📄 description.md   # The full problem description in Markdown
 └── 📄 mySolution.js    # The JS starting template, ready for your logic
```

`mySolution.js` will look something like this:

```javascript
/**
 * Solution for Question 1 - Two Sum
 */

/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your logic here
};

module.exports = twoSum;
```

### 🧪 Testing your Solution

Inside the generated folder, you can automatically test your `mySolution.js` using the official LeetCode examples:

```bash
cd 0001
leetcode-test
```

This command will:
1. Identify the problem ID from the folder name.
2. Fetch the test cases directly from LeetCode's GraphQL API.
3. Parse the expected outputs from the problem description.
4. Run your `mySolution.js` against the test cases and validate the results.

## 🛠️ Tech Stack

- **[Node.js](https://nodejs.org)** - Core execution environment.
- **[Turndown](https://github.com/mixmark-io/turndown)** - Converts LeetCode's raw HTML descriptions into elegant Markdown.
- **Fetch API** - Communicates natively with LeetCode's REST and GraphQL endpoints.

---

<div align="center">
  <i>Happy Coding! 💻🔥</i>
</div>
