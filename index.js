#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');

const turndownService = new TurndownService();

const questionNumber = process.argv[2];

if (!questionNumber) {
    console.error("❌ Error: You need to provide the question number.");
    console.log("👉 Usage example: leetcode-gen 1");
    process.exit(1);
}

const folderName = questionNumber.padStart(4, '0');
const targetPath = path.join(process.cwd(), folderName);

if (fs.existsSync(targetPath)) {
    console.error(`⚠️ The folder "${folderName}" already exists in this directory.`);
    process.exit(1);
}

async function fetchProblemData(id) {
    console.log("⏳ Fetching problems list...");
    const listRes = await fetch('https://leetcode.com/api/problems/all/');
    if (!listRes.ok) throw new Error("Failed to fetch problems list.");
    const listData = await listRes.json();
    
    let targetSlug = null;
    const targetId = parseInt(id, 10);
    for (const problem of listData.stat_status_pairs) {
        if (problem.stat.frontend_question_id === targetId) {
            targetSlug = problem.stat.question__title_slug;
            break;
        }
    }
    
    if (!targetSlug) {
        throw new Error(`Problem with ID ${targetId} not found.`);
    }

    console.log(`⏳ Fetching details for "${targetSlug}"...`);
    const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        questionFrontendId
        title
        content
        codeSnippets {
          lang
          langSlug
          code
        }
      }
    }`;
    
    const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': `https://leetcode.com/problems/${targetSlug}/`
        },
        body: JSON.stringify({
            query,
            variables: { titleSlug: targetSlug }
        })
    });
    
    if (!res.ok) throw new Error("Failed to fetch problem details.");
    const data = await res.json();
    
    if (!data.data || !data.data.question) {
        throw new Error("Invalid response from GraphQL API.");
    }
    
    return data.data.question;
}

async function main() {
    let createdFolder = false;
    try {
        const questionData = await fetchProblemData(questionNumber);
        
        fs.mkdirSync(targetPath);
        createdFolder = true;

        const mdDescription = questionData.content ? turndownService.turndown(questionData.content) : "No description available.";
        const mdContent = `# Question ${questionNumber}: ${questionData.title}\n\n${mdDescription}\n`;

        const jsSnippet = questionData.codeSnippets ? questionData.codeSnippets.find(s => s.langSlug === 'javascript') : null;
        const initialCode = jsSnippet ? jsSnippet.code : "function solve() {\n  // Your logic here\n}";
        
        let exportName = "solve";
        if (jsSnippet) {
            const codeWithoutComments = initialCode.replace(/\/\*[\s\S]*?\*\//g, '');
            const match = codeWithoutComments.match(/(?:var|let|const|function)\s+([a-zA-Z0-9_]+)\s*(?:=|\()/);
            if (match) {
                exportName = match[1];
            }
        }
        
        const jsContent = `/**\n * Solution for Question ${questionNumber} - ${questionData.title}\n */\n\n${initialCode}\n\nmodule.exports = ${exportName};\n`;

        fs.writeFileSync(path.join(targetPath, 'description.md'), mdContent);
        fs.writeFileSync(path.join(targetPath, 'mySolution.js'), jsContent);

        console.log(`✅ Success! Folder "${folderName}" created with description.md and mySolution.js.`);
    } catch (error) {
        if (createdFolder && fs.existsSync(targetPath)) {
            // Clean up the folder if creation failed midway
            fs.rmSync(targetPath, { recursive: true, force: true });
        }
        console.error("❌ An error occurred:", error.message);
    }
}

main();