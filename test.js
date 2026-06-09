#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function fetchProblemData(id) {
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

    const query = `
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        exampleTestcases
        metaData
        content
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
    
    return data.data.question;
}

function parseTestcases(exampleTestcases, metaDataStr) {
    const metaData = JSON.parse(metaDataStr);
    const paramsCount = metaData.params.length;

    // Replace \r\n with \n for Windows compatibility
    const lines = exampleTestcases.replace(/\r\n/g, '\n').split('\n');
    const testcases = [];
    
    for (let i = 0; i < lines.length; i += paramsCount) {
        const args = [];
        for (let j = 0; j < paramsCount; j++) {
            if (i + j < lines.length) {
                let val = lines[i + j].trim();
                if (!val) continue;
                try {
                    args.push(JSON.parse(val));
                } catch (e) {
                    args.push(val);
                }
            }
        }
        if (args.length === paramsCount) {
            testcases.push(args);
        }
    }
    return testcases;
}

function extractExpectedOutputs(content) {
    const outputs = [];
    
    // LeetCode descriptions might use <strong>Output:</strong> or <b>Output:</b>
    const regex = /(?:<strong>|<b>)Output:(?:<\/strong>|<\/b>)\s*(.*?)(?=<|\n)/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
        let val = match[1].trim();
        try {
            val = JSON.parse(val);
        } catch(e) {
            // Keep as string if not valid JSON
        }
        outputs.push(val);
    }
    return outputs;
}

async function main() {
    const cwd = process.cwd();
    const folderName = path.basename(cwd);
    const id = parseInt(folderName, 10);
    
    if (isNaN(id)) {
        console.error(`❌ Current folder "${folderName}" is not a valid question number.`);
        console.log("👉 You must run this command inside a generated problem folder (e.g. 0001).");
        process.exit(1);
    }
    
    const solutionPath = path.join(cwd, 'mySolution.js');
    if (!fs.existsSync(solutionPath)) {
        console.error("❌ mySolution.js not found in current directory.");
        process.exit(1);
    }
    
    let solution;
    try {
        solution = require(solutionPath);
    } catch (e) {
        console.error(`❌ Failed to load mySolution.js: ${e.message}`);
        process.exit(1);
    }

    if (typeof solution !== 'function') {
        console.error("❌ mySolution.js must export a function (e.g. module.exports = twoSum;).");
        process.exit(1);
    }

    console.log(`⏳ Fetching testcases for problem ${folderName}...`);
    try {
        const questionData = await fetchProblemData(id);
        const testcases = parseTestcases(questionData.exampleTestcases, questionData.metaData);
        let expectedOutputs = [];
        if (questionData.content) {
            expectedOutputs = extractExpectedOutputs(questionData.content);
        }
        
        console.log(`✅ Found ${testcases.length} testcases.`);
        console.log();
        
        let allPassed = true;
        
        testcases.forEach((args, idx) => {
            console.log(`--- Testcase ${idx + 1} ---`);
            args.forEach((arg, i) => {
                console.log(`Input ${i + 1}:`, typeof arg === 'object' ? JSON.stringify(arg) : arg);
            });
            
            const start = performance.now();
            const clonedArgs = JSON.parse(JSON.stringify(args));
            let result;
            let error = null;
            try {
                 result = solution(...clonedArgs);
            } catch(e) {
                 error = e;
            }
            const end = performance.now();
            
            if (error) {
                 console.log(`❌ Error: ${error.message}`);
                 allPassed = false;
            } else {
                 console.log(`Output:`, typeof result === 'object' ? JSON.stringify(result) : result);
                 
                 if (idx < expectedOutputs.length) {
                     const expected = expectedOutputs[idx];
                     console.log(`Expected:`, typeof expected === 'object' ? JSON.stringify(expected) : expected);
                     
                     const resultStr = JSON.stringify(result);
                     const expectedStr = JSON.stringify(expected);
                     
                     if (resultStr === expectedStr) {
                         console.log(`✅ Passed (${(end - start).toFixed(2)}ms)`);
                     } else {
                         console.log(`❌ Failed (${(end - start).toFixed(2)}ms)`);
                         allPassed = false;
                     }
                 } else {
                     console.log(`⏱️ Executed in ${(end - start).toFixed(2)}ms`);
                 }
            }
            console.log();
        });
        
        if (expectedOutputs.length > 0) {
            if (allPassed) {
                console.log("🎉 All testcases passed!");
            } else {
                console.log("⚠️ Some testcases failed.");
            }
        } else {
            console.log("⚠️ Could not extract expected outputs from description for automatic validation.");
        }
        
    } catch (err) {
        console.error("❌ Failed to run tests:", err.message);
    }
}

main();
