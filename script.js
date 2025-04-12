document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const compareBtn = document.getElementById('compareBtn');
    const clearBtn = document.getElementById('clearBtn');
    const originalText = document.getElementById('originalText');
    const modifiedText = document.getElementById('modifiedText');
    const diffOutput = document.getElementById('diffOutput');
    const sideBySideDiff = document.getElementById('sideBySideDiff');
    const originalDiffContent = document.getElementById('originalDiffContent');
    const modifiedDiffContent = document.getElementById('modifiedDiffContent');
    const originalLineNumbers = document.getElementById('originalLineNumbers');
    const modifiedLineNumbers = document.getElementById('modifiedLineNumbers');
    const originalDiffLineNumbers = document.getElementById('originalDiffLineNumbers');
    const modifiedDiffLineNumbers = document.getElementById('modifiedDiffLineNumbers');
    const unifiedViewBtn = document.getElementById('unifiedViewBtn');
    const sideBySideViewBtn = document.getElementById('sideBySideViewBtn');
    const ignoreWhitespace = document.getElementById('ignoreWhitespace');
    const ignoreCase = document.getElementById('ignoreCase');
    const showLineNumbers = document.getElementById('showLineNumbers');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const downloadResultBtn = document.getElementById('downloadResultBtn');
    const originalFileBtn = document.getElementById('originalFileBtn');
    const modifiedFileBtn = document.getElementById('modifiedFileBtn');
    const originalFileInput = document.getElementById('originalFileInput');
    const modifiedFileInput = document.getElementById('modifiedFileInput');
    const addedCount = document.getElementById('addedCount');
    const removedCount = document.getElementById('removedCount');
    const unchangedCount = document.getElementById('unchangedCount');

    // State variables
    let currentView = 'unified';
    let lastComparisonResult = null;

    // Event Listeners
    compareBtn.addEventListener('click', compareTexts);
    clearBtn.addEventListener('click', clearAll);
    unifiedViewBtn.addEventListener('click', () => switchView('unified'));
    sideBySideViewBtn.addEventListener('click', () => switchView('sideBySide'));
    showLineNumbers.addEventListener('change', updateLineNumbersVisibility);
    loadSampleBtn.addEventListener('click', loadSampleText);
    downloadResultBtn.addEventListener('click', downloadComparisonResult);
    originalFileBtn.addEventListener('click', () => originalFileInput.click());
    modifiedFileBtn.addEventListener('click', () => modifiedFileInput.click());
    originalFileInput.addEventListener('change', (e) => handleFileUpload(e, originalText));
    modifiedFileInput.addEventListener('change', (e) => handleFileUpload(e, modifiedText));

    // Initialize line numbers
    originalText.addEventListener('input', () => updateLineNumbers(originalText, originalLineNumbers));
    modifiedText.addEventListener('input', () => updateLineNumbers(modifiedText, modifiedLineNumbers));
    
    // Initialize with empty line numbers
    updateLineNumbers(originalText, originalLineNumbers);
    updateLineNumbers(modifiedText, modifiedLineNumbers);

    /**
     * Main comparison function
     */
    function compareTexts() {
        let original = originalText.value;
        let modified = modifiedText.value;
        
        // Apply options
        if (ignoreWhitespace.checked) {
            original = original.replace(/\s+/g, ' ').trim();
            modified = modified.replace(/\s+/g, ' ').trim();
        }
        
        if (ignoreCase.checked) {
            original = original.toLowerCase();
            modified = modified.toLowerCase();
        }

        // Create diff using diff_match_patch library
        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(original, modifiedText.value);
        dmp.diff_cleanupSemantic(diffs);
        
        // Store the result for later use (e.g., downloading)
        lastComparisonResult = diffs;
        
        // Update the diff statistics
        updateDiffStats(diffs);
        
        // Render the appropriate view
        if (currentView === 'unified') {
            renderUnifiedView(diffs);
        } else {
            renderSideBySideView(diffs);
        }
    }

    /**
     * Render unified diff view
     */
    function renderUnifiedView(diffs) {
        diffOutput.innerHTML = '';
        
        diffs.forEach(diff => {
            const [type, text] = diff;
            const span = document.createElement('span');
            span.textContent = text;
            
            switch(type) {
                case 1: // Addition
                    span.className = 'diff-added';
                    break;
                case -1: // Deletion
                    span.className = 'diff-removed';
                    break;
                case 0: // Unchanged
                    span.className = 'diff-unchanged';
                    break;
            }
            
            diffOutput.appendChild(span);
        });
    }

    /**
     * Render side-by-side diff view
     */
    function renderSideBySideView(diffs) {
        originalDiffContent.innerHTML = '';
        modifiedDiffContent.innerHTML = '';
        originalDiffLineNumbers.innerHTML = '';
        modifiedDiffLineNumbers.innerHTML = '';
        
        let originalLines = [];
        let modifiedLines = [];
        
        let currentOriginalLine = '';
        let currentModifiedLine = '';
        
        // Process diffs into lines
        diffs.forEach(diff => {
            const [type, text] = diff;
            const lines = text.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const isLastLine = i === lines.length - 1;
                
                if (type === -1 || type === 0) { // Deletion or unchanged
                    currentOriginalLine += line;
                    if (!isLastLine || line.endsWith('\n')) {
                        originalLines.push({ text: currentOriginalLine, type });
                        currentOriginalLine = '';
                    }
                }
                
                if (type === 1 || type === 0) { // Addition or unchanged
                    currentModifiedLine += line;
                    if (!isLastLine || line.endsWith('\n')) {
                        modifiedLines.push({ text: currentModifiedLine, type });
                        currentModifiedLine = '';
                    }
                }
                
                if (!isLastLine) {
                    if (type === -1 && currentModifiedLine === '') {
                        modifiedLines.push({ text: '', type: -2 }); // Placeholder for empty line
                    } else if (type === 1 && currentOriginalLine === '') {
                        originalLines.push({ text: '', type: -2 }); // Placeholder for empty line
                    }
                }
            }
        });
        
        // Add any remaining content
        if (currentOriginalLine) {
            originalLines.push({ text: currentOriginalLine, type: -1 });
        }
        if (currentModifiedLine) {
            modifiedLines.push({ text: currentModifiedLine, type: 1 });
        }
        
        // Ensure both sides have the same number of lines
        const maxLines = Math.max(originalLines.length, modifiedLines.length);
        while (originalLines.length < maxLines) originalLines.push({ text: '', type: -2 });
        while (modifiedLines.length < maxLines) modifiedLines.push({ text: '', type: -2 });
        
        // Render lines
        for (let i = 0; i < maxLines; i++) {
            const originalLine = originalLines[i];
            const modifiedLine = modifiedLines[i];
            
            // Original side
            const originalLineEl = document.createElement('div');
            originalLineEl.textContent = originalLine.text;
            originalLineEl.className = 'diff-line';
            
            if (originalLine.type === -1) {
                originalLineEl.classList.add('diff-line-removed');
            } else if (originalLine.type === 0) {
                originalLineEl.classList.add('diff-line-unchanged');
            }
            
            originalDiffContent.appendChild(originalLineEl);
            
            // Modified side
            const modifiedLineEl = document.createElement('div');
            modifiedLineEl.textContent = modifiedLine.text;
            modifiedLineEl.className = 'diff-line';
            
            if (modifiedLine.type === 1) {
                modifiedLineEl.classList.add('diff-line-added');
            } else if (modifiedLine.type === 0) {
                modifiedLineEl.classList.add('diff-line-unchanged');
            }
            
            modifiedDiffContent.appendChild(modifiedLineEl);
            
            // Line numbers
            if (showLineNumbers.checked) {
                const originalLineNum = document.createElement('div');
                originalLineNum.textContent = originalLine.type !== -2 ? (i + 1) : '';
                originalLineNum.className = 'line-number';
                originalDiffLineNumbers.appendChild(originalLineNum);
                
                const modifiedLineNum = document.createElement('div');
                modifiedLineNum.textContent = modifiedLine.type !== -2 ? (i + 1) : '';
                modifiedLineNum.className = 'line-number';
                modifiedDiffLineNumbers.appendChild(modifiedLineNum);
            }
        }
    }

    /**
     * Update diff statistics
     */
    function updateDiffStats(diffs) {
        let added = 0;
        let removed = 0;
        let unchanged = 0;
        
        diffs.forEach(diff => {
            const [type, text] = diff;
            const count = text.length;
            
            switch(type) {
                case 1: // Addition
                    added += count;
                    break;
                case -1: // Deletion
                    removed += count;
                    break;
                case 0: // Unchanged
                    unchanged += count;
                    break;
            }
        });
        
        addedCount.textContent = `${added} additions`;
        removedCount.textContent = `${removed} deletions`;
        unchangedCount.textContent = `${unchanged} unchanged`;
    }

    /**
     * Switch between unified and side-by-side views
     */
    function switchView(view) {
        currentView = view;
        
        if (view === 'unified') {
            unifiedViewBtn.classList.add('active');
            sideBySideViewBtn.classList.remove('active');
            diffOutput.classList.remove('hidden');
            sideBySideDiff.classList.add('hidden');
        } else {
            unifiedViewBtn.classList.remove('active');
            sideBySideViewBtn.classList.add('active');
            diffOutput.classList.add('hidden');
            sideBySideDiff.classList.remove('hidden');
        }
        
        if (lastComparisonResult) {
            if (view === 'unified') {
                renderUnifiedView(lastComparisonResult);
            } else {
                renderSideBySideView(lastComparisonResult);
            }
        }
    }

    /**
     * Update line numbers in the editors
     */
    function updateLineNumbers(textarea, lineNumbersElement) {
        const lines = textarea.value.split('\n');
        lineNumbersElement.innerHTML = '';
        
        if (showLineNumbers.checked) {
            for (let i = 0; i < lines.length; i++) {
                const lineNumber = document.createElement('div');
                lineNumber.textContent = i + 1;
                lineNumber.className = 'line-number';
                lineNumbersElement.appendChild(lineNumber);
            }
        }
        
        // Sync scroll position
        textarea.addEventListener('scroll', () => {
            lineNumbersElement.scrollTop = textarea.scrollTop;
        });
    }

    /**
     * Update line numbers visibility based on checkbox
     */
    function updateLineNumbersVisibility() {
        const lineNumberElements = document.querySelectorAll('.line-numbers');
        
        lineNumberElements.forEach(element => {
            if (showLineNumbers.checked) {
                element.style.display = 'block';
                updateLineNumbers(originalText, originalLineNumbers);
                updateLineNumbers(modifiedText, modifiedLineNumbers);
                if (lastComparisonResult && currentView === 'sideBySide') {
                    renderSideBySideView(lastComparisonResult);
                }
            } else {
                element.style.display = 'none';
            }
        });
    }

    /**
     * Clear all text and results
     */
    function clearAll() {
        originalText.value = '';
        modifiedText.value = '';
        diffOutput.innerHTML = '';
        originalDiffContent.innerHTML = '';
        modifiedDiffContent.innerHTML = '';
        originalLineNumbers.innerHTML = '';
        modifiedLineNumbers.innerHTML = '';
        originalDiffLineNumbers.innerHTML = '';
        modifiedDiffLineNumbers.innerHTML = '';
        addedCount.textContent = '0 additions';
        removedCount.textContent = '0 deletions';
        unchangedCount.textContent = '0 unchanged';
        lastComparisonResult = null;
        
        // Reset file inputs
        originalFileInput.value = '';
        modifiedFileInput.value = '';
    }

    /**
     * Handle file uploads
     */
    function handleFileUpload(event, targetTextarea) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            targetTextarea.value = e.target.result;
            if (targetTextarea === originalText) {
                updateLineNumbers(originalText, originalLineNumbers);
            } else {
                updateLineNumbers(modifiedText, modifiedLineNumbers);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Load sample text for demonstration
     */
    function loadSampleText() {
        originalText.value = `function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total += items[i].price;
    }
    return total;
}`;

        modifiedText.value = `function calculateTotal(items) {
    // Use reduce for cleaner code
    return items.reduce((total, item) => {
        return total + item.price;
    }, 0);
}`;

        updateLineNumbers(originalText, originalLineNumbers);
        updateLineNumbers(modifiedText, modifiedLineNumbers);
    }

    /**
     * Download comparison result
     */
    function downloadComparisonResult() {
        if (!lastComparisonResult) {
            alert('No comparison result to download. Please compare texts first.');
            return;
        }
        
        let content = '';
        
        if (currentView === 'unified') {
            content = diffOutput.innerText;
        } else {
            // Create a formatted side-by-side view for download
            const originalLines = originalDiffContent.innerText.split('\n');
            const modifiedLines = modifiedDiffContent.innerText.split('\n');
            
            for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
                const originalLine = i < originalLines.length ? originalLines[i] : '';
                const modifiedLine = i < modifiedLines.length ? modifiedLines[i] : '';
                content += `${originalLine} | ${modifiedLine}\n`;
            }
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comparison-result.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Enable tab key in textareas
    [originalText, modifiedText].forEach(textarea => {
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '\t' + 
                               textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }
        });
    });
});