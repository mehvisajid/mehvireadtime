/**
 * Mehvi — Read Time Calculator for Articles & Blogs
 * script.js
 * Vanilla JavaScript (ES6+) with zero dependencies
 * Client-side only: 100% private in-browser text calculation
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. DOM Elements
  // ---------------------------------------------------------------------------
  const textarea = document.getElementById('calc-input');
  const liveCharIndicator = document.getElementById('live-char-indicator');
  const btnSample = document.getElementById('btn-sample');
  const btnPaste = document.getElementById('btn-paste');
  const btnClear = document.getElementById('btn-clear');
  const btnReset = document.getElementById('btn-reset');
  const btnCopy = document.getElementById('btn-copy');
  const btnDownload = document.getElementById('btn-download');
  const btnPrint = document.getElementById('btn-print');
  const feedbackToast = document.getElementById('feedback-toast');

  // Reading time display elements
  const primaryTimeDisplay = document.getElementById('primary-reading-time');
  const primaryTimeSubtitle = document.getElementById('primary-time-subtitle');
  const timeSlowDisplay = document.getElementById('time-slow');
  const timeAvgDisplay = document.getElementById('time-avg');
  const timeFastDisplay = document.getElementById('time-fast');

  // Statistics display elements
  const statWords = document.getElementById('stat-words');
  const statCharsWithSpaces = document.getElementById('stat-chars-spaces');
  const statCharsNoSpaces = document.getElementById('stat-chars-nospaces');
  const statSentences = document.getElementById('stat-sentences');
  const statParagraphs = document.getElementById('stat-paragraphs');
  const statAvgWordsSentence = document.getElementById('stat-avg-words');

  // Speed controls
  const speedButtons = document.querySelectorAll('.speed-btn');
  const customSpeedBox = document.getElementById('custom-speed-box');
  const customSpeedInput = document.getElementById('custom-wpm-input');
  const customSpeedError = document.getElementById('custom-speed-error');
  const speedCompareCards = document.querySelectorAll('.speed-compare-card');

  // Mobile Navigation
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const copyrightYear = document.getElementById('copyright-year');

  // ---------------------------------------------------------------------------
  // 2. Application State
  // ---------------------------------------------------------------------------
  const state = {
    selectedSpeedMode: 'average', // 'slow', 'average', 'fast', 'custom'
    speeds: {
      slow: 150,
      average: 200,
      fast: 250,
      custom: 200
    },
    metrics: {
      words: 0,
      charsWithSpaces: 0,
      charsNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      avgWordsPerSentence: '0'
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Editorial Sample Text (450 Words)
  // ---------------------------------------------------------------------------
  const SAMPLE_TEXT = `The Cognitive Science of Digital Reading: How Layout Shapes Comprehension

In an era dominated by rapid information flow, the way humans absorb written content has shifted dramatically. Cognitive psychologists have documented that readers no longer consume digital articles the same way they read print books. Instead of linear, sentence-by-sentence progression, digital eyes tend to follow an F-shaped or Z-shaped skimming trajectory across the screen.

When readers encounter an online article, they subconsciously evaluate cognitive load before committing their attention. An accurate reading time estimate serves as an implicit psychological contract. By telling the reader in advance that an article requires four minutes, publishers reduce the anxiety of open-ended commitment. This simple metric directly correlates with lower bounce rates and deeper scroll depth.

However, reading speed is not a fixed universal constant. The widely accepted baseline for silent English reading is 200 words per minute among adults. When readers encounter technical terminology, dense arguments, or nuanced prose, that pace naturally drops toward 150 words per minute or slower. Conversely, experienced editors and casual scanners can breeze through familiar concepts at 250 to 300 words per minute without sacrificing overall gist comprehension.

Sentence length and structural formatting exert a profound impact on cognitive processing. Long, multi-clause sentences with archaic punctuation demand working memory buffers, slowing the pace. In contrast, well-paced paragraphs, descriptive subheadings, and concise sentence structures enhance visual rhythm. Writers who monitor their average words per sentence can fine-tune their rhythm, ensuring their ideas remain accessible to diverse readers.

Ultimately, calculated reading time is more than just a convenient statistic for blog cards. It is an editorial design tool that harmonizes the writer's depth with the reader's finite attention span, fostering meaningful engagement in an increasingly distracted digital ecosystem.`;

  // ---------------------------------------------------------------------------
  // 4. Core Text Analytics Functions
  // ---------------------------------------------------------------------------

  /**
   * Calculates all metrics from the raw input text.
   * Defensively handles whitespace, punctuation, numbers, and Unicode.
   */
  function analyzeText(rawText) {
    if (!rawText || rawText.trim() === '') {
      return {
        words: 0,
        charsWithSpaces: 0,
        charsNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        avgWordsPerSentence: '0'
      };
    }

    const text = rawText.trim();

    // 1. Words: split by any whitespace sequence
    const wordsArray = text.split(/\s+/).filter(function (token) {
      return token.length > 0;
    });
    const words = wordsArray.length;

    // 2. Characters
    const charsWithSpaces = rawText.length;
    const charsNoSpaces = rawText.replace(/\s/g, '').length;

    // 3. Sentences: Punctuation-based boundary approximation (. ! ?)
    // Match one or more terminal marks followed by whitespace or string end
    const sentenceMatches = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
    let sentences = 0;
    if (sentenceMatches && sentenceMatches.length > 0) {
      sentences = sentenceMatches.length;
    } else if (words > 0) {
      // If there are words but no terminal punctuation, count as at least 1 sentence
      sentences = 1;
    }

    // 4. Paragraphs: Blocks separated by one or more blank lines
    const paragraphsArray = rawText.split(/\n+/).map(function (p) {
      return p.trim();
    }).filter(function (p) {
      return p.length > 0;
    });
    const paragraphs = paragraphsArray.length > 0 ? paragraphsArray.length : (words > 0 ? 1 : 0);

    // 5. Average words per sentence
    const avgWordsPerSentence = sentences > 0 ? (words / sentences).toFixed(1) : '0';

    return {
      words: words,
      charsWithSpaces: charsWithSpaces,
      charsNoSpaces: charsNoSpaces,
      sentences: sentences,
      paragraphs: paragraphs,
      avgWordsPerSentence: avgWordsPerSentence
    };
  }

  /**
   * Converts word count and WPM to human-readable time format (minutes & seconds)
   */
  function calculateReadingTime(wordCount, wpm) {
    if (wordCount === 0 || !wpm || wpm <= 0) {
      return {
        totalSeconds: 0,
        minutes: 0,
        seconds: 0,
        formatted: '0 min 0 sec',
        shortFormatted: '0 sec'
      };
    }

    // Round up to nearest second
    const totalSeconds = Math.ceil((wordCount / wpm) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let formatted = '';
    if (minutes === 0) {
      formatted = `${seconds} sec`;
    } else if (seconds === 0) {
      formatted = `${minutes} min`;
    } else {
      formatted = `${minutes} min ${seconds} sec`;
    }

    let shortFormatted = '';
    if (minutes === 0) {
      shortFormatted = `${seconds}s`;
    } else if (seconds === 0) {
      shortFormatted = `${minutes}m`;
    } else {
      shortFormatted = `${minutes}m ${seconds}s`;
    }

    return {
      totalSeconds: totalSeconds,
      minutes: minutes,
      seconds: seconds,
      formatted: formatted,
      shortFormatted: shortFormatted
    };
  }

  // ---------------------------------------------------------------------------
  // 5. UI Render & State Synchronization
  // ---------------------------------------------------------------------------

  function getActiveWpm() {
    if (state.selectedSpeedMode === 'custom') {
      return state.speeds.custom;
    }
    return state.speeds[state.selectedSpeedMode] || 200;
  }

  function updateUI() {
    const rawText = textarea ? textarea.value : '';
    const metrics = analyzeText(rawText);
    state.metrics = metrics;

    const activeWpm = getActiveWpm();

    // Update live quick indicators
    if (liveCharIndicator) {
      liveCharIndicator.textContent = `${metrics.words.toLocaleString()} words · ${metrics.charsWithSpaces.toLocaleString()} chars`;
    }

    // Update stats grid
    if (statWords) statWords.textContent = metrics.words.toLocaleString();
    if (statCharsWithSpaces) statCharsWithSpaces.textContent = metrics.charsWithSpaces.toLocaleString();
    if (statCharsNoSpaces) statCharsNoSpaces.textContent = metrics.charsNoSpaces.toLocaleString();
    if (statSentences) statSentences.textContent = metrics.sentences.toLocaleString();
    if (statParagraphs) statParagraphs.textContent = metrics.paragraphs.toLocaleString();
    if (statAvgWordsSentence) statAvgWordsSentence.textContent = metrics.avgWordsPerSentence;

    // Update reading time displays
    const mainTime = calculateReadingTime(metrics.words, activeWpm);
    const slowTime = calculateReadingTime(metrics.words, state.speeds.slow);
    const avgTime = calculateReadingTime(metrics.words, state.speeds.average);
    const fastTime = calculateReadingTime(metrics.words, state.speeds.fast);

    if (primaryTimeDisplay && primaryTimeSubtitle) {
      if (metrics.words === 0) {
        primaryTimeDisplay.textContent = '0 min 0 sec';
        primaryTimeSubtitle.textContent = 'Enter or paste text above to see estimated reading time';
      } else {
        primaryTimeDisplay.textContent = mainTime.formatted;
        primaryTimeSubtitle.textContent = `Calculated at ${activeWpm} WPM (${getSpeedModeLabel(state.selectedSpeedMode)})`;
      }
    }

    // Update 3-speed comparison cards
    if (timeSlowDisplay) timeSlowDisplay.textContent = metrics.words === 0 ? '0s' : slowTime.formatted;
    if (timeAvgDisplay) timeAvgDisplay.textContent = metrics.words === 0 ? '0s' : avgTime.formatted;
    if (timeFastDisplay) timeFastDisplay.textContent = metrics.words === 0 ? '0s' : fastTime.formatted;

    // Synchronize active highlights on comparison cards
    speedCompareCards.forEach(function (card) {
      const mode = card.getAttribute('data-speed-mode');
      if (mode === state.selectedSpeedMode) {
        card.classList.add('current');
      } else {
        card.classList.remove('current');
      }
    });
  }

  function getSpeedModeLabel(mode) {
    switch (mode) {
      case 'slow': return 'Slow Speed';
      case 'average': return 'Average Speed';
      case 'fast': return 'Fast Speed';
      case 'custom': return 'Custom Speed';
      default: return 'Standard Speed';
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Action Handlers: Sample, Clear, Reset, Paste
  // ---------------------------------------------------------------------------

  function handleLoadSample() {
    if (!textarea) return;
    textarea.value = SAMPLE_TEXT;
    updateUI();
    textarea.focus();
    showFeedbackToast('✓ Loaded sample article text');
  }

  function handleClearText() {
    if (!textarea) return;
    textarea.value = '';
    updateUI();
    textarea.focus();
    showFeedbackToast('✓ Cleared text area');
  }

  function handleReset() {
    if (!textarea) return;
    textarea.value = '';
    state.selectedSpeedMode = 'average';
    state.speeds.custom = 200;
    if (customSpeedInput) customSpeedInput.value = '200';
    if (customSpeedBox) customSpeedBox.classList.remove('show');
    if (customSpeedError) customSpeedError.style.display = 'none';

    speedButtons.forEach(function (btn) {
      if (btn.getAttribute('data-speed') === 'average') {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    updateUI();
    textarea.focus();
    showFeedbackToast('✓ Calculator reset to defaults');
  }

  function handlePasteText() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (clipText) {
        if (clipText && textarea) {
          textarea.value = clipText;
          updateUI();
          showFeedbackToast('✓ Text pasted from clipboard');
        } else {
          showFeedbackToast('Clipboard was empty');
        }
      }).catch(function () {
        // Fallback for permissions blocked in iframe
        if (textarea) textarea.focus();
        showFeedbackToast('Press Ctrl+V (or Cmd+V) to paste');
      });
    } else {
      if (textarea) textarea.focus();
      showFeedbackToast('Press Ctrl+V (or Cmd+V) to paste');
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Speed Controls & Validation
  // ---------------------------------------------------------------------------

  function handleSpeedButtonClick(e) {
    const btn = e.currentTarget;
    const speed = btn.getAttribute('data-speed');

    speedButtons.forEach(function (b) {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    state.selectedSpeedMode = speed;

    if (speed === 'custom') {
      if (customSpeedBox) customSpeedBox.classList.add('show');
      if (customSpeedInput) {
        customSpeedInput.focus();
        validateAndSetCustomWpm();
      }
    } else {
      if (customSpeedBox) customSpeedBox.classList.remove('show');
      if (customSpeedError) customSpeedError.style.display = 'none';
      updateUI();
    }
  }

  function validateAndSetCustomWpm() {
    if (!customSpeedInput) return;
    const valStr = customSpeedInput.value.trim();
    const valNum = parseInt(valStr, 10);

    if (isNaN(valNum) || valNum < 50 || valNum > 1000) {
      if (customSpeedError) {
        customSpeedError.textContent = 'Please enter a valid reading speed between 50 and 1,000 WPM.';
        customSpeedError.style.display = 'block';
      }
      return;
    }

    if (customSpeedError) {
      customSpeedError.style.display = 'none';
    }

    state.speeds.custom = valNum;
    updateUI();
  }

  // ---------------------------------------------------------------------------
  // 8. Copy and Download Report
  // ---------------------------------------------------------------------------

  function buildReportText() {
    const activeWpm = getActiveWpm();
    const mainTime = calculateReadingTime(state.metrics.words, activeWpm);
    const slowTime = calculateReadingTime(state.metrics.words, state.speeds.slow);
    const avgTime = calculateReadingTime(state.metrics.words, state.speeds.average);
    const fastTime = calculateReadingTime(state.metrics.words, state.speeds.fast);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return [
      '====================================================================',
      'MEHVI — READ TIME & TEXT METRICS REPORT',
      `Generated on: ${dateStr} at ${timeStr}`,
      'Website: https://mehvireadtime.netlify.app/',
      '====================================================================',
      '',
      '1. ESTIMATED READING TIMES',
      `• Selected Reading Speed (${activeWpm} WPM): ${mainTime.formatted}`,
      `• Slow Reading Speed (150 WPM): ${slowTime.formatted}`,
      `• Average Reading Speed (200 WPM): ${avgTime.formatted}`,
      `• Fast Reading Speed (250 WPM): ${fastTime.formatted}`,
      '',
      '2. CONTENT & TEXT STATISTICS',
      `• Total Word Count: ${state.metrics.words.toLocaleString()}`,
      `• Character Count (including spaces): ${state.metrics.charsWithSpaces.toLocaleString()}`,
      `• Character Count (excluding spaces): ${state.metrics.charsNoSpaces.toLocaleString()}`,
      `• Sentence Count: ${state.metrics.sentences.toLocaleString()}`,
      `• Paragraph Count: ${state.metrics.paragraphs.toLocaleString()}`,
      `• Average Words Per Sentence: ${state.metrics.avgWordsPerSentence}`,
      '',
      '3. METHODOLOGY & CALCULATION FORMULA',
      '• Reading Time Formula: Reading Time (Minutes) = Word Count ÷ Words Per Minute (WPM)',
      '• Text processed 100% locally in browser memory with zero server transmission.',
      '===================================================================='
    ].join('\n');
  }

  function handleCopyResults() {
    if (state.metrics.words === 0) {
      showFeedbackToast('Please enter text to copy results');
      return;
    }

    const report = buildReportText();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(report).then(function () {
        showFeedbackToast('✓ Copied results to clipboard!');
      }).catch(function () {
        fallbackCopyText(report);
      });
    } else {
      fallbackCopyText(report);
    }
  }

  function fallbackCopyText(textToCopy) {
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = textToCopy;
    tempTextarea.setAttribute('readonly', '');
    tempTextarea.style.position = 'absolute';
    tempTextarea.style.left = '-9999px';
    document.body.appendChild(tempTextarea);
    tempTextarea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showFeedbackToast('✓ Copied results to clipboard!');
      } else {
        showFeedbackToast('Unable to copy automatically. Please select text manually.');
      }
    } catch (err) {
      showFeedbackToast('Copy failed. Please try again.');
    } finally {
      document.body.removeChild(tempTextarea);
    }
  }

  function handleDownloadReport() {
    if (state.metrics.words === 0) {
      showFeedbackToast('Please enter text before downloading report');
      return;
    }

    const report = buildReportText();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `mehvi-reading-time-report-${Date.now()}.txt`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(function () {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    showFeedbackToast('✓ Downloaded results report (.txt)');
  }

  function handlePrintResults() {
    if (state.metrics.words === 0) {
      showFeedbackToast('Please enter text before printing');
      return;
    }
    window.print();
  }

  let toastTimeout = null;
  function showFeedbackToast(message) {
    if (!feedbackToast) return;
    feedbackToast.textContent = message;
    feedbackToast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      feedbackToast.classList.remove('show');
    }, 2800);
  }

  // ---------------------------------------------------------------------------
  // 9. Mobile Hamburger Navigation
  // ---------------------------------------------------------------------------

  function setupMobileNavigation() {
    if (!hamburgerBtn || !navMenu) return;

    hamburgerBtn.addEventListener('click', function () {
      const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
      hamburgerBtn.setAttribute('aria-expanded', String(!isExpanded));
      navMenu.classList.toggle('is-active');
    });

    // Close menu when a navigation link is clicked
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-active');
      });
    });

    // Close mobile menu on resize to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768 && navMenu.classList.contains('is-active')) {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-active');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 10. Sticky Header Shadow on Scroll
  // ---------------------------------------------------------------------------
  function setupHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // 11. Initialization
  // ---------------------------------------------------------------------------

  function init() {
    // Dynamic copyright year
    if (copyrightYear) {
      copyrightYear.textContent = new Date().getFullYear();
    }

    // Attach Textarea listeners
    if (textarea) {
      textarea.addEventListener('input', updateUI);
      textarea.addEventListener('paste', function () {
        setTimeout(updateUI, 10);
      });
    }

    // Attach Utility buttons
    if (btnSample) btnSample.addEventListener('click', handleLoadSample);
    if (btnPaste) btnPaste.addEventListener('click', handlePasteText);
    if (btnClear) btnClear.addEventListener('click', handleClearText);
    if (btnReset) btnReset.addEventListener('click', handleReset);

    // Attach Speed buttons
    speedButtons.forEach(function (btn) {
      btn.addEventListener('click', handleSpeedButtonClick);
    });

    // Attach Custom WPM input listeners
    if (customSpeedInput) {
      customSpeedInput.addEventListener('input', validateAndSetCustomWpm);
      customSpeedInput.addEventListener('change', validateAndSetCustomWpm);
    }

    // Attach Report buttons
    if (btnCopy) btnCopy.addEventListener('click', handleCopyResults);
    if (btnDownload) btnDownload.addEventListener('click', handleDownloadReport);
    if (btnPrint) btnPrint.addEventListener('click', handlePrintResults);

    // Mobile navigation & header
    setupMobileNavigation();
    setupHeaderScroll();

    // Initial render
    updateUI();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
