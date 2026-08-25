/**
 * Petal App Ratings & Reviews - Client Application & CSV Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  const csvUrlInput = document.getElementById('csv-url-input');
  const loadCsvBtn = document.getElementById('load-csv-btn');
  const endpointStatusMsg = document.getElementById('endpoint-status-msg');
  const searchInput = document.getElementById('search-input');
  const filterPills = document.querySelectorAll('.filter-pill');
  const reviewsList = document.getElementById('reviews-list');
  const emptyState = document.getElementById('empty-state');
  
  // Rating Summary Elements
  const avgRatingValue = document.getElementById('avg-rating-value');
  const avgRatingStars = document.getElementById('avg-rating-stars');
  const totalReviewsText = document.getElementById('total-reviews-text');
  
  // Modal Elements
  const openFormBtn = document.getElementById('open-form-btn');
  const formModal = document.getElementById('form-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');

  // Application State
  let rawReviews = [];
  let currentRatingFilter = 'all'; // 'all', '1', '2', '3', '4', '5', 'replied'
  let currentSearchQuery = '';

  // Sample Fallback Data (for immediate preview before connecting live endpoint)
  const sampleReviews = [
    {
      timestamp: '2026-08-25 14:20:10',
      username: 'Alex R.',
      rating: 5,
      review: 'Petal Browser is super fast and lightweight! Loving the modern Material 3 Expressive UI design and custom background themes.',
      developerReply: 'Thank you Alex! We are thrilled you love the performance and custom themes!'
    },
    {
      timestamp: '2026-08-25 12:05:44',
      username: 'DevStudio User',
      rating: 5,
      review: 'The built-in tab manager and privacy controls are unmatched. Smooth performance on Android.',
      developerReply: ''
    },
    {
      timestamp: '2026-08-24 18:30:12',
      username: 'Michael K.',
      rating: 4,
      review: 'Great browser! Download manager works really well. Would love to see more extensions support.',
      developerReply: 'Thanks for the suggestion Michael! We are expanding extension support in the next release.'
    },
    {
      timestamp: '2026-08-24 09:15:30',
      username: 'Sophia L.',
      rating: 5,
      review: 'HTTPS default security enforcement is a huge plus. No captcha issues anywhere.',
      developerReply: ''
    }
  ];

  // Theme Management
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeIcon.textContent = newTheme === 'light' ? 'light_mode' : 'dark_mode';
  });

  // Modal Management
  openFormBtn.addEventListener('click', () => formModal.classList.remove('hidden'));
  closeModalBtn.addEventListener('click', () => formModal.classList.add('hidden'));
  cancelModalBtn.addEventListener('click', () => formModal.classList.add('hidden'));
  formModal.addEventListener('click', (e) => {
    if (e.target === formModal) formModal.classList.add('hidden');
  });

  // Load CSV Data Trigger
  loadCsvBtn.addEventListener('click', () => {
    const url = csvUrlInput.value.trim();
    if (url) {
      fetchCsvData(url);
    }
  });

  // Search & Filtering
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    renderFilteredReviews();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      if (pill.dataset.rating) {
        currentRatingFilter = pill.dataset.rating;
      } else if (pill.dataset.filter === 'replied') {
        currentRatingFilter = 'replied';
      }
      renderFilteredReviews();
    });
  });

  /**
   * Parses CSV string into structured array of review objects.
   * Handles quoted strings, commas inside quotes, and line breaks.
   */
  function parseCSV(csvText) {
    const lines = [];
    let curRow = [''];
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const c = csvText[i];
      const nextC = csvText[i + 1];

      if (c === '"') {
        if (inQuotes && nextC === '"') {
          curRow[curRow.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        curRow.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && nextC === '\n') {
          i++;
        }
        lines.push(curRow);
        curRow = [''];
      } else {
        curRow[curRow.length - 1] += c;
      }
    }
    if (curRow.length > 1 || curRow[0] !== '') {
      lines.push(curRow);
    }

    if (lines.length <= 1) return [];

    // Header row: Timestamp, Username, Rating, Review, Developer Reply
    const reviews = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.length >= 4) {
        const ratingVal = parseInt(row[2], 10);
        reviews.push({
          timestamp: row[0] ? row[0].trim() : '',
          username: row[1] ? row[1].trim() : 'Anonymous',
          rating: isNaN(ratingVal) ? 5 : Math.max(1, Math.min(5, ratingVal)),
          review: row[3] ? row[3].trim() : '',
          developerReply: row[4] ? row[4].trim() : ''
        });
      }
    }
    return reviews;
  }

  /**
   * Fetches CSV from published Google Sheet endpoint.
   */
  async function fetchCsvData(url) {
    endpointStatusMsg.innerHTML = `<span class="status-indicator" style="background: #f59e0b;"></span> Fetching live CSV backend data...`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const parsedData = parseCSV(text);

      if (parsedData.length > 0) {
        rawReviews = parsedData;
        endpointStatusMsg.innerHTML = `<span class="status-indicator" style="background: #10b981;"></span> Successfully loaded ${parsedData.length} live reviews.`;
      } else {
        endpointStatusMsg.innerHTML = `<span class="status-indicator" style="background: #ef4444;"></span> Dataset parsed empty. Showing sample entries.`;
        rawReviews = sampleReviews;
      }
    } catch (err) {
      console.warn('CSV fetch error or sample endpoint:', err);
      endpointStatusMsg.innerHTML = `<span class="status-indicator" style="background: #ef4444;"></span> Live fetch fallback (CORS / Sample). Showing preview entries.`;
      rawReviews = sampleReviews;
    }

    updateStatsAndRender();
  }

  /**
   * Updates overall ratings statistics and renders reviews.
   */
  function updateStatsAndRender() {
    if (rawReviews.length === 0) {
      avgRatingValue.textContent = '0.0';
      totalReviewsText.textContent = 'Based on 0 reviews';
      renderFilteredReviews();
      return;
    }

    const totalCount = rawReviews.length;
    const sumRating = rawReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgScore = (sumRating / totalCount).toFixed(1);

    avgRatingValue.textContent = avgScore;
    totalReviewsText.textContent = `Based on ${totalCount} review${totalCount > 1 ? 's' : ''}`;

    // Render Star Rating Icons
    const fullStars = Math.floor(avgScore);
    const halfStar = (avgScore - fullStars) >= 0.5;
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        starsHtml += `<span class="material-symbols-rounded">star</span>`;
      } else if (i === fullStars + 1 && halfStar) {
        starsHtml += `<span class="material-symbols-rounded">star_half</span>`;
      } else {
        starsHtml += `<span class="material-symbols-rounded" style="color: var(--star-empty);">star</span>`;
      }
    }
    avgRatingStars.innerHTML = starsHtml;

    // Distribution Bars
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    rawReviews.forEach(r => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });

    for (let i = 1; i <= 5; i++) {
      const count = counts[i];
      const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
      document.getElementById(`count-${i}`).textContent = count;
      document.getElementById(`bar-${i}`).style.width = `${percent}%`;
    }

    renderFilteredReviews();
  }

  /**
   * Filters and renders review cards in grid.
   */
  function renderFilteredReviews() {
    reviewsList.innerHTML = '';

    const filtered = rawReviews.filter(item => {
      // Rating filter
      if (currentRatingFilter !== 'all') {
        if (currentRatingFilter === 'replied') {
          if (!item.developerReply) return false;
        } else {
          if (item.rating.toString() !== currentRatingFilter) return false;
        }
      }

      // Keyword search
      if (currentSearchQuery) {
        const query = currentSearchQuery;
        const nameMatch = item.username.toLowerCase().includes(query);
        const reviewMatch = item.review.toLowerCase().includes(query);
        const replyMatch = item.developerReply.toLowerCase().includes(query);
        if (!nameMatch && !reviewMatch && !replyMatch) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    } else {
      emptyState.classList.add('hidden');
    }

    filtered.forEach(review => {
      const card = document.createElement('div');
      card.className = 'review-card';

      // Avatar Initial
      const initial = review.username.charAt(0).toUpperCase() || 'P';

      // Card Star Rating
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= review.rating) {
          starsHtml += `<span class="material-symbols-rounded">star</span>`;
        } else {
          starsHtml += `<span class="material-symbols-rounded" style="color: var(--star-empty);">star</span>`;
        }
      }

      // Developer Reply Block
      let replyHtml = '';
      if (review.developerReply) {
        replyHtml = `
          <div class="developer-reply-box">
            <div class="reply-header">
              <span class="material-symbols-rounded">verified</span>
              <span>Developer Reply</span>
            </div>
            <div class="reply-text">${escapeHtml(review.developerReply)}</div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="review-card-header">
          <div class="user-info">
            <div class="user-avatar">${initial}</div>
            <div>
              <div class="user-name">${escapeHtml(review.username)}</div>
              <div class="review-date">${escapeHtml(review.timestamp)}</div>
            </div>
          </div>
          <div class="card-stars">${starsHtml}</div>
        </div>
        <div class="review-text">${escapeHtml(review.review)}</div>
        ${replyHtml}
      `;

      reviewsList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize with Sample Data Preview
  rawReviews = sampleReviews;
  updateStatsAndRender();
});
