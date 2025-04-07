document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const originalTextArea = document.getElementById('original');
    const modifiedTextArea = document.getElementById('modified');
    const compareBtn = document.getElementById('compare-btn');
    const realtimeCheckbox = document.getElementById('realtime');
    const ignoreWhitespaceCheckbox = document.getElementById('ignore-whitespace');
    const ignoreCaseCheckbox = document.getElementById('ignore-case');
    const originalLinesDiv = document.querySelector('.pane.original .lines');
    const modifiedLinesDiv = document.querySelector('.pane.modified .lines');
    const originalPane = document.querySelector('.pane.original');
    const modifiedPane = document.querySelector('.pane.modified');
    const clearBtns = document.querySelectorAll('.clear-btn');
    const originalFileInput = document.getElementById('original-file');
    const modifiedFileInput = document.getElementById('modified-file');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const toggleInstructions = document.getElementById('toggle-instructions');
    const instructionsContent = document.getElementById('instructions-content');
    const diffSummary = document.querySelector('.diff-summary');
    const prevDiffBtn = document.getElementById('prev-diff');
    const nextDiffBtn = document.getElementById('next-diff');

    let differences = []; // Store diff positions for navigation

    // Utility Functions
    function escapeHtml(text) {
        return text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#039;');
    }

    function preprocessText(text) {
        if (ignoreWhitespaceCheckbox.checked) {
            text = text.replace(/\s+/g, ' ').trim();
        }
        if (ignoreCaseCheckbox.checked) {
            text = text.toLowerCase();
        }
        return text;
    }

    // Debounce Function
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Compare Texts Function
    function compareTexts() {
        let text1 = originalTextArea.value;
        let text2 = modifiedTextArea.value;

        text1 = preprocessText(text1);
        text2 = preprocessText(text2);

        const originalLines = text1.split('\n');
        const modifiedLines = text2.split('\n');
        const diff = Diff.diffArrays(originalLines, modifiedLines);
        let originalHtml = '';
        let modifiedHtml = '';
        let originalLineNum = 1;
        let modifiedLineNum = 1;
        let additions = 0;
        let deletions = 0;
        let changes = 0;
        differences = [];

        let i = 0;
        while (i < diff.length) {
            const part = diff[i];
            if (!part.added && !part.removed) {
                part.value.forEach(line => {
                    originalHtml += `<div class="line unchanged"><span class="line-number">${originalLineNum}</span>${escapeHtml(line)}</div>`;
                    modifiedHtml += `<div class="line unchanged"><span class="line-number">${modifiedLineNum}</span>${escapeHtml(line)}</div>`;
                    originalLineNum++;
                    modifiedLineNum++;
                });
            } else if (part.removed && i + 1 < diff.length && diff[i + 1].added) {
                const removedLines = part.value;
                const addedLines = diff[i + 1].value;
                const minLength = Math.min(removedLines.length, addedLines.length);
                for (let j = 0; j < minLength; j++) {
                    const removedLine = removedLines[j];
                    const addedLine = addedLines[j];
                    const wordDiff = Diff.diffWords(removedLine, addedLine);
                    let originalLineHtml = `<span class="line-number">${originalLineNum}</span>`;
                    let modifiedLineHtml = `<span class="line-number">${modifiedLineNum}</span>`;
                    wordDiff.forEach(wordPart => {
                        if (wordPart.added) {
                            modifiedLineHtml += `<span class="diff added">${escapeHtml(wordPart.value)}</span>`;
                        } else if (wordPart.removed) {
                            originalLineHtml += `<span class="diff removed">${escapeHtml(wordPart.value)}</span>`;
                        } else {
                            originalLineHtml += escapeHtml(wordPart.value);
                            modifiedLineHtml += escapeHtml(wordPart.value);
                        }
                    });
                    originalHtml += `<div class="line changed" data-diff-id="${differences.length}">${originalLineHtml}</div>`;
                    modifiedHtml += `<div class="line changed" data-diff-id="${differences.length}">${modifiedLineHtml}</div>`;
                    differences.push({ originalLineNum, modifiedLineNum });
                    originalLineNum++;
                    modifiedLineNum++;
                    changes++;
                }
                if (removedLines.length > addedLines.length) {
격격for (let j = minLength; j < removedLines.length; j++) {
                        originalHtml += `<div class="line deleted" data-diff-id="${differences.length}"><span class="line-number">${originalLineNum}</span>${escapeHtml(removedLines[j])}</div>`;
                        modifiedHtml += `<div class="line empty"></div>`;
                        differences.push({ originalLineNum });
                        originalLineNum++;
                        deletions++;
                    }
                } else if (addedLines.length > removedLines.length) {
                    for (let j = minLength; j < addedLines.length; j++) {
                        originalHtml += `<div class="line empty"></div>`;
                        modifiedHtml += `<div class="line added" data-diff-id="${differences.length}"><span class="line-number">${modifiedLineNum}</span>${escapeHtml(addedLines[j])}</div>`;
                        differences.push({ modifiedLineNum });
                        modifiedLineNum++;
                        additions++;
                    }
                }
                i++;
            } else if (part.removed) {
                part.value.forEach(line => {
                    originalHtml += `<div class="line deleted" data-diff-id="${differences.length}"><span class="line-number">${originalLineNum}</span>${escapeHtml(line)}</div>`;
                    modifiedHtml += `<div class="line empty"></div>`;
                    differences.push({ originalLineNum });
                    originalLineNum++;
                    deletions++;
                });
            } else if (part.added) {
                part.value.forEach(line => {
                    originalHtml += `<div class="line empty"></div>`;
                    modifiedHtml += `<div class="line added" data-diff-id="${differences.length}"><span class="line-number">${modifiedLineNum}</span>${escapeHtml(line)}</div>`;
                    differences.push({ modifiedLineNum });
                    modifiedLineNum++;
                    additions++;
                });
            }
            i++;
        }

        originalLinesDiv.innerHTML = originalHtml;
        modifiedLinesDiv.innerHTML = modifiedHtml;
        diffSummary.textContent = `Differences: ${additions} additions, ${deletions} deletions, ${changes} changes`;
        updateNavigationButtons();
    }

    // Synchronized Scrolling
    function syncScroll(source, target) {
        target.scrollTop = source.scrollTop;
    }

    originalPane.addEventListener('scroll', () => syncScroll(originalPane, modifiedPane));
    modifiedPane.addEventListener('scroll', () => syncScroll(modifiedPane, originalPane));

    // Event Listeners
    clearBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).value = '';
            if (realtimeCheckbox.checked) compareTexts();
        });
    });

    originalFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                originalTextArea.value = e.target.result;
                if (realtimeCheckbox.checked) compareTexts();
            };
            reader.readAsText(file);
        }
    });

    modifiedFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                modifiedTextArea.value = e.target.result;
                if (realtimeCheckbox.checked) compareTexts();
            };
            reader.readAsText(file);
        }
    });

    compareBtn.addEventListener('click', compareTexts);

    const debouncedCompare = debounce(compareTexts, 300);
    originalTextArea.addEventListener('input', () => {
        if (realtimeCheckbox.checked) debouncedCompare();
    });
    modifiedTextArea.addEventListener('input', () => {
        if (realtimeCheckbox.checked) debouncedCompare();
    });
    realtimeCheckbox.addEventListener('change', () => {
        if (realtimeCheckbox.checked) compareTexts();
    });
    ignoreWhitespaceCheckbox.addEventListener('change', compareTexts);
    ignoreCaseCheckbox.addEventListener('change', compareTexts);

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    toggleInstructions.addEventListener('click', () => {
        instructionsContent.classList.toggle('hidden');
        toggleInstructions.textContent = instructionsContent.classList.contains('hidden') ? '▼' : '▲';
    });

    // Navigation
    let currentDiffIndex = -1;

    function updateNavigationButtons() {
        prevDiffBtn.disabled = differences.length === 0 || currentDiffIndex <= 0;
        nextDiffBtn.disabled = differences.length === 0 || currentDiffIndex >= differences.length - 1;
    }

    function scrollToDiff(index) {
        if (index >= 0 && index < differences.length) {
            const diff = differences[index];
            const line = diff.originalLineNum ? originalLinesDiv.querySelector(`[data-diff-id="${index}"]`) : modifiedLinesDiv.querySelector(`[data-diff-id="${index}"]`);
            if (line) {
                line.scrollIntoView({ behavior: 'smooth', block: 'center' });
                currentDiffIndex = index;
                updateNavigationButtons();
            }
        }
    }

    prevDiffBtn.addEventListener('click', () => scrollToDiff(currentDiffIndex - 1));
    nextDiffBtn.addEventListener('click', () => scrollToDiff(currentDiffIndex + 1));
});