document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const leftText = document.getElementById('leftText');
    const rightText = document.getElementById('rightText');
    const leftLineNumbers = document.getElementById('leftLineNumbers');
    const rightLineNumbers = document.getElementById('rightLineNumbers');
    const leftStats = document.getElementById('leftStats');
    const rightStats = document.getElementById('rightStats');
    const compareBtn = document.getElementById('compareBtn');
    const clearBtn = document.getElementById('clearBtn');
    const clearLeftBtn = document.getElementById('clearLeft');
    const clearRightBtn = document.getElementById('clearRight');
    const pasteLeftBtn = document.getElementById('pasteLeft');
    const pasteRightBtn = document.getElementById('pasteRight');
    const resultsContent = document.getElementById('resultsContent');
    const ignoreCase = document.getElementById('ignoreCase');
    const ignoreWhitespace = document.getElementById('ignoreWhitespace');
    const trimLines = document.getElementById('trimLines');
    const themeToggle = document.querySelector('.theme-toggle');
    
    // Also check for a control button if that's what you're using
    const controlBtn = document.getElementById('controlBtn');
    if (controlBtn) {
        controlBtn.addEventListener('click', compareTexts);
    }

    // Initialize line numbers and stats
    updateLineNumbers(leftText, leftLineNumbers);
    updateLineNumbers(rightText, rightLineNumbers);
    updateStats(leftText, leftStats);
    updateStats(rightText, rightStats);

    // Event listeners for text areas
    leftText.addEventListener('input', function() {
        updateLineNumbers(leftText, leftLineNumbers);
        updateStats(leftText, leftStats);
    });

    rightText.addEventListener('input', function() {
        updateLineNumbers(rightText, rightLineNumbers);
        updateStats(rightText, rightStats);
    });

    leftText.addEventListener('scroll', function() {
        leftLineNumbers.scrollTop = leftText.scrollTop;
    });

    rightText.addEventListener('scroll', function() {
        rightLineNumbers.scrollTop = rightText.scrollTop;
    });

    // Button event listeners
    compareBtn.addEventListener('click', compareTexts);
    
    clearBtn.addEventListener('click', function() {
        leftText.value = '';
        rightText.value = '';
        updateLineNumbers(leftText, leftLineNumbers);
        updateLineNumbers(rightText, rightLineNumbers);
        updateStats(leftText, leftStats);
        updateStats(rightText, rightStats);
        resetResults();
    });

    clearLeftBtn.addEventListener('click', function() {
        leftText.value = '';
        updateLineNumbers(leftText, leftLineNumbers);
        updateStats(leftText, leftStats);
    });

    clearRightBtn.addEventListener('click', function() {
        rightText.value = '';
        updateLineNumbers(rightText, rightLineNumbers);
        updateStats(rightText, rightStats);
    });

    pasteLeftBtn.addEventListener('click', async function() {
        try {
            const text = await navigator.clipboard.readText();
            leftText.value = text;
            updateLineNumbers(leftText, leftLineNumbers);
            updateStats(leftText, leftStats);
        } catch (err) {
            alert('Failed to read clipboard. Please check browser permissions.');
        }
    });

    pasteRightBtn.addEventListener('click', async function() {
        try {
            const text = await navigator.clipboard.readText();
            rightText.value = text;
            updateLineNumbers(rightText, rightLineNumbers);
            updateStats(rightText, rightStats);
        } catch (err) {
            alert('Failed to read clipboard. Please check browser permissions.');
        }
    });

    // Theme toggle
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    // Functions
    function updateLineNumbers(textarea, lineNumbersElement) {
        const lines = textarea.value.split('\n');
        const lineCount = lines.length;
        
        let lineNumbersHTML = '';
        for (let i = 1; i <= lineCount; i++) {
            lineNumbersHTML += `<div>${i}</div>`;
        }
        
        lineNumbersElement.innerHTML = lineNumbersHTML;
    }

    function updateStats(textarea, statsElement) {
        const text = textarea.value;
        const lines = text.split('\n').length;
        const chars = text.length;
        
        statsElement.textContent = `Lines: ${lines} | Characters: ${chars}`;
    }

    function resetResults() {
        resultsContent.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-code-compare fa-3x"></i>
                <p>Click "Compare" to see the differences between the texts</p>
            </div>
        `;
    }

    function compareTexts() {
        console.log("Compare function triggered"); // Debug log
        let leftContent = leftText.value;
        let rightContent = rightText.value;
        
        // Apply options
        if (ignoreCase.checked) {
            leftContent = leftContent.toLowerCase();
            rightContent = rightContent.toLowerCase();
        }
        
        let leftLines = leftContent.split('\n');
        let rightLines = rightContent.split('\n');
        
        if (trimLines.checked) {
            leftLines = leftLines.map(line => line.trim());
            rightLines = rightLines.map(line => line.trim());
        }
        
        if (ignoreWhitespace.checked) {
            leftLines = leftLines.map(line => line.replace(/\s+/g, ' '));
            rightLines = rightLines.map(line => line.replace(/\s+/g, ' '));
        }
        
        // Check if diff library is available
        if (typeof Diff === 'undefined') {
            resultsContent.innerHTML = `
                <div class="placeholder">
                    <i class="fas fa-exclamation-circle fa-3x" style="color: #dc3545;"></i>
                    <p>Error: Diff library not loaded. Please check your internet connection or include the library manually.</p>
                </div>
            `;
            console.error("Diff library not loaded");
            return;
        }
        
        try {
            // Use diff library to compute differences
            const diff = Diff.diffLines(leftLines.join('\n'), rightLines.join('\n'));
            
            // Generate HTML for the diff view
            let diffHTML = '';
            let leftLineNum = 1;
            let rightLineNum = 1;
            
            // Track counts for summary
            let addedLines = 0;
            let removedLines = 0;
            let unchangedLines = 0;
            
            diff.forEach(part => {
                const value = part.value;
                const lines = value.split('\n');
                // Remove the last empty line that comes from split
                if (lines[lines.length - 1] === '') {
                    lines.pop();
                }
                
                lines.forEach(line => {
                    if (part.added) {
                        addedLines++;
                        diffHTML += `
                            <div class="diff-line added">
                                <div class="line-number">-</div>
                                <div class="line-number">${rightLineNum++}</div>
                                <div class="line-content">${escapeHTML(line)}</div>
                            </div>
                        `;
                    } else if (part.removed) {
                        removedLines++;
                        diffHTML += `
                            <div class="diff-line removed">
                                <div class="line-number">${leftLineNum++}</div>
                                <div class="line-number">-</div>
                                <div class="line-content">${escapeHTML(line)}</div>
                            </div>
                        `;
                    } else {
                        unchangedLines++;
                        diffHTML += `
                            <div class="diff-line">
                                <div class="line-number">${leftLineNum++}</div>
                                <div class="line-number">${rightLineNum++}</div>
                                <div class="line-content">${escapeHTML(line)}</div>
                            </div>
                        `;
                    }
                });
            });
            
            // If no differences found
            if (diffHTML === '') {
                resultsContent.innerHTML = `
                    <div class="placeholder">
                        <i class="fas fa-check-circle fa-3x" style="color: var(--added-border);"></i>
                        <p>No differences found! The texts are identical.</p>
                    </div>
                `;
                return;
            }
            
            // Add summary at the top
            const summaryHTML = `
                <div class="diff-summary">
                    <div class="summary-item"><span class="color-box added"></span> ${addedLines} lines added</div>
                    <div class="summary-item"><span class="color-box removed"></span> ${removedLines} lines removed</div>
                    <div class="summary-item"><span class="color-box"></span> ${unchangedLines} lines unchanged</div>
                </div>
            `;
            
            resultsContent.innerHTML = summaryHTML + diffHTML;
            
            // Make results container focusable for keyboard navigation
            resultsContent.setAttribute('tabindex', '0');
            
            // Highlight inline differences for better visibility
            highlightInlineDifferences();
        } catch (error) {
            console.error("Error during comparison:", error);
            resultsContent.innerHTML = `
                <div class="placeholder">
                    <i class="fas fa-exclamation-circle fa-3x" style="color: #dc3545;"></i>
                    <p>An error occurred during comparison: ${error.message}</p>
                </div>
            `;
        }
    }

    function escapeHTML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function highlightInlineDifferences() {
        // Get all adjacent added/removed lines
        const diffLines = document.querySelectorAll('.diff-line');
        
        for (let i = 0; i < diffLines.length - 1; i++) {
            const currentLine = diffLines[i];
            const nextLine = diffLines[i + 1];
            
            if (currentLine.classList.contains('removed') && nextLine.classList.contains('added')) {
                const removedText = currentLine.querySelector('.line-content').textContent;
                const addedText = nextLine.querySelector('.line-content').textContent;
                
                // Use character-by-character diff for inline highlighting
                const charDiff = Diff.diffChars(removedText, addedText);
                
                let removedHTML = '';
                let addedHTML = '';
                
                charDiff.forEach(part => {
                    if (part.added) {
                        addedHTML += `<span class="inline-diff added">${escapeHTML(part.value)}</span>`;
                    } else if (part.removed) {
                        removedHTML += `<span class="inline-diff removed">${escapeHTML(part.value)}</span>`;
                    } else {
                        removedHTML += escapeHTML(part.value);
                        addedHTML += escapeHTML(part.value);
                    }
                });
                
                currentLine.querySelector('.line-content').innerHTML = removedHTML;
                nextLine.querySelector('.line-content').innerHTML = addedHTML;
                
                // Mark these lines as modified for better visual distinction
                currentLine.classList.add('modified');
                nextLine.classList.add('modified');
                
                // Skip the next line since we've already processed it
                i++;
            }
        }
    }
    
    // Add keyboard navigation for results
    resultsContent.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown') {
            navigateToNextDifference();
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            navigateToPreviousDifference();
            e.preventDefault();
        }
    });
    
    // Navigation functions
    function navigateToNextDifference() {
        const diffLines = document.querySelectorAll('.diff-line.added, .diff-line.removed');
        if (diffLines.length === 0) return;
        
        let currentFocus = -1;
        
        // Find the currently visible difference
        for (let i = 0; i < diffLines.length; i++) {
            const rect = diffLines[i].getBoundingClientRect();
            if (rect.top > 0) {
                currentFocus = i;
                break;
            }
        }
        
        // Move to the next difference
        if (currentFocus < diffLines.length - 1) {
            diffLines[currentFocus + 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    function navigateToPreviousDifference() {
        const diffLines = document.querySelectorAll('.diff-line.added, .diff-line.removed');
        if (diffLines.length === 0) return;
        
        let currentFocus = diffLines.length;
        
        // Find the currently visible difference
        for (let i = diffLines.length - 1; i >= 0; i--) {
            const rect = diffLines[i].getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                currentFocus = i;
                break;
            }
        }
        
        // Move to the previous difference
        if (currentFocus > 0) {
            diffLines[currentFocus - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter to compare
        if (e.ctrlKey && e.key === 'Enter') {
            compareTexts();
            e.preventDefault();
        }
        
        // Ctrl+Shift+C to clear all
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            clearBtn.click();
            e.preventDefault();
        }
    });

    // Handle drag and drop
    [leftText, rightText].forEach(textarea => {
        textarea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        textarea.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        
        textarea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.value = event.target.result;
                    if (this === leftText) {
                        updateLineNumbers(leftText, leftLineNumbers);
                        updateStats(leftText, leftStats);
                    } else {
                        updateLineNumbers(rightText, rightLineNumbers);
                        updateStats(rightText, rightStats);
                    }
                };
                reader.readAsText(file);
            }
        });
    });

    // Add CSS class for drag and drop visual feedback
    const style = document.createElement('style');
    style.textContent = `
        textarea.dragover {
            border: 2px dashed var(--primary-color) !important;
            background-color: rgba(74, 108, 247, 0.05) !important;
        }
        
        .diff-summary {
            display: flex;
            gap: 1.5rem;
            padding: 0.75rem 1rem;
            background-color: var(--panel-bg);
            border-radius: 6px;
            margin-bottom: 1rem;
        }
        
        .summary-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(style);
});