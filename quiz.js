// 系統狀態變數
const systemState = {
  currentUser: null,
  isAuthenticated: false,
  currentSubject: null,
  currentMode: null,
  questions: [],
  currentQuiz: [],
  currentQuestionIndex: 0,
  quizAnswers: [],
  quizResults: [],
  historyRecords: JSON.parse(localStorage.getItem('quizHistory')) || [],
  isLoading: false,
  error: null
};

// DOM元素快取
const domElements = {
  // 驗證區
  loadingOverlay: document.getElementById('loading-overlay'),
  authContainer: document.getElementById('auth-container'),
  passwordInput: document.getElementById('password-input'),
  passwordError: document.getElementById('password-error'),
  loginBtn: document.getElementById('login-btn'),
  
  // 主系統
  appContainer: document.getElementById('app-container'),
  logoutBtn: document.getElementById('logout-btn'),
  currentSubject: document.getElementById('current-subject'),
  
  // 科目選擇
  subjectSelect: document.getElementById('subject-select'),
  selectSubjectBtn: document.getElementById('select-subject-btn'),
  subjectInfo: document.getElementById('subject-info'),
  subjectDetails: document.getElementById('subject-details'),
  
  // 模式選擇
  modeSelection: document.getElementById('mode-selection'),
  practiceModeBtn: document.getElementById('practice-mode-btn'),
  examModeBtn: document.getElementById('exam-mode-btn'),
  historyBtn: document.getElementById('history-btn'),
  
  // 練習設定
  customPractice: document.getElementById('custom-practice'),
  singleCount: document.getElementById('single-count'),
  multiCount: document.getElementById('multi-count'),
  startPracticeBtn: document.getElementById('start-practice-btn'),
  
  // 測驗介面
  quizInterface: document.getElementById('quiz-interface'),
  quizTitle: document.getElementById('quiz-title'),
  quizProgress: document.getElementById('quiz-progress'),
  questionContainer: document.getElementById('question-container'),
  
  // 結果區
  resultContainer: document.getElementById('result-container'),
  resultContent: document.getElementById('result-content'),
  reviewBtn: document.getElementById('review-btn'),
  newQuizBtn: document.getElementById('new-quiz-btn'),
  
  // 歷史紀錄
  historyContainer: document.getElementById('history-container'),
  historyList: document.getElementById('history-list'),
  backToQuizBtn: document.getElementById('back-to-quiz-btn'),
  deleteHistoryBtn: document.getElementById('delete-history-btn')
};

// 初始化系統
function initSystem() {
  // 模擬系統載入
  setTimeout(() => {
    domElements.loadingOverlay.style.display = 'none';
    
    // 檢查是否已登入
    if (localStorage.getItem('isAuthenticated') === 'true') {
      systemState.isAuthenticated = true;
      domElements.authContainer.style.display = 'none';
      domElements.appContainer.style.display = 'block';
    } else {
      domElements.authContainer.style.display = 'flex';
    }
  }, 1500);
  
  // 綁定事件監聽器
  bindEventListeners();
}

// 綁定所有事件監聽器
function bindEventListeners() {
  // 登入相關
  domElements.loginBtn.addEventListener('click', handleLogin);
  domElements.passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  domElements.logoutBtn.addEventListener('click', handleLogout);
  
  // 科目選擇
  domElements.selectSubjectBtn.addEventListener('click', handleSubjectSelection);
  
  // 模式選擇
  domElements.practiceModeBtn.addEventListener('click', () => selectMode('practice'));
  domElements.examModeBtn.addEventListener('click', () => selectMode('exam'));
  domElements.historyBtn.addEventListener('click', showHistory);
  
  // 練習設定
  domElements.startPracticeBtn.addEventListener('click', startCustomPractice);
  
  // 結果區
  domElements.reviewBtn.addEventListener('click', reviewWrongAnswers);
  domElements.newQuizBtn.addEventListener('click', resetForNewQuiz);
  
  // 歷史紀錄
  domElements.backToQuizBtn.addEventListener('click', backToQuizFromHistory);
  domElements.deleteHistoryBtn.addEventListener('click', confirmDeleteHistory);
  
  // 複選題自動保存答案
  document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox' && 
        e.target.name.startsWith('q') && 
        systemState.currentMode) {
      const index = parseInt(e.target.name.substring(1));
      saveAnswer(index, 'multiple_choice');
    }
  });
}

// 登入處理
function handleLogin() {
  const password = domElements.passwordInput.value.trim();
  
  if (!password) {
    domElements.passwordError.textContent = '請輸入密碼';
    domElements.passwordInput.focus();
    return;
  }
  
  // 實務上應使用雜湊比對而非明文
  if (password === '22143') {
    systemState.isAuthenticated = true;
    localStorage.setItem('isAuthenticated', 'true');
    domElements.authContainer.style.display = 'none';
    domElements.appContainer.style.display = 'block';
    domElements.passwordInput.value = '';
    domElements.passwordError.textContent = '';
  } else {
    domElements.passwordError.textContent = '密碼錯誤，請重新輸入';
    domElements.passwordInput.value = '';
    domElements.passwordInput.focus();
  }
}

// 登出處理
function handleLogout() {
  systemState.isAuthenticated = false;
  localStorage.removeItem('isAuthenticated');
  domElements.appContainer.style.display = 'none';
  domElements.authContainer.style.display = 'flex';
  domElements.passwordInput.value = '';
  resetSystemState();
}

// 重置系統狀態
function resetSystemState() {
  systemState.currentSubject = null;
  systemState.currentMode = null;
  systemState.questions = [];
  systemState.currentQuiz = [];
  systemState.currentQuestionIndex = 0;
  systemState.quizAnswers = [];
  systemState.quizResults = [];
  
  // 重置UI
  domElements.subjectSelect.value = '';
  domElements.subjectInfo.style.display = 'none';
  domElements.modeSelection.style.display = 'none';
  domElements.customPractice.style.display = 'none';
  domElements.quizInterface.style.display = 'none';
  domElements.resultContainer.style.display = 'none';
  domElements.historyContainer.style.display = 'none';
  domElements.currentSubject.textContent = '';
}

// 科目選擇處理
async function handleSubjectSelection() {
  const subjectId = domElements.subjectSelect.value;
  
  if (!subjectId) {
    alert('請選擇科目');
    return;
  }
  
  systemState.currentSubject = subjectId;
  domElements.currentSubject.textContent = domElements.subjectSelect.selectedOptions[0].text;
  
  try {
    // 顯示載入狀態
    systemState.isLoading = true;
    domElements.loadingOverlay.style.display = 'flex';
    
    // 載入題庫資料
    const data = await loadSubjectData(subjectId);
    systemState.questions = data.questions;
    
    displaySubjectInfo(data);
    domElements.modeSelection.style.display = 'block';
  } catch (error) {
    console.error('載入題庫失敗:', error);
    domElements.subjectDetails.innerHTML = `
      <p class="error">載入題庫失敗: ${error.message || '請稍後再試'}</p>
    `;
  } finally {
    systemState.isLoading = false;
    domElements.loadingOverlay.style.display = 'none';
  }
}

// 載入科目資料
async function loadSubjectData(subjectId) {
  try {
    const response = await fetch(`data/${subjectId}.json`);
    if (!response.ok) {
      throw new Error(`網路請求失敗: ${response.status}`);
    }
    const data = await response.json();
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('題庫格式錯誤');
    }
    
    return data;
  } catch (error) {
    console.error('載入題庫失敗:', error);
    throw error;
  }
}

// 顯示科目資訊
function displaySubjectInfo(data) {
  const singleChoiceCount = data.questions.filter(q => q.type === "single_choice").length;
  const multiChoiceCount = data.questions.filter(q => q.type === "multiple_choice").length;
  const trueFalseCount = data.questions.filter(q => q.type === "true_false").length;
  
  domElements.subjectDetails.innerHTML = `
    <p><strong>題庫統計：</strong></p>
    <ul>
      <li>單選題：${singleChoiceCount} 題</li>
      <li>複選題：${multiChoiceCount} 題</li>
      <li>是非題：${trueFalseCount} 題</li>
      <li>總題數：${data.questions.length} 題</li>
    </ul>
    <p>請選擇測驗模式開始練習或測驗</p>
  `;
  
  domElements.subjectInfo.style.display = 'block';
}

// 選擇模式
function selectMode(mode) {
  systemState.currentMode = mode;
  
  if (mode === 'practice') {
    domElements.customPractice.style.display = 'block';
    domElements.quizInterface.style.display = 'none';
    domElements.resultContainer.style.display = 'none';
    domElements.historyContainer.style.display = 'none';
  } else {
    startExamMode();
  }
}

// 開始自訂練習
function startCustomPractice() {
  const singleCount = parseInt(domElements.singleCount.value) || 0;
  const multiCount = parseInt(domElements.multiCount.value) || 0;
  
  if (singleCount + multiCount === 0) {
    alert('請設定至少一種題型的數量');
    return;
  }
  
  // 篩選題目
  const singleQuestions = systemState.questions.filter(q => q.type === 'single_choice');
  const multiQuestions = systemState.questions.filter(q => q.type === 'multiple_choice');
  
  // 隨機選擇題目
  systemState.currentQuiz = [
    ...getRandomQuestions(singleQuestions, singleCount),
    ...getRandomQuestions(multiQuestions, multiCount)
  ];
  
  if (systemState.currentQuiz.length === 0) {
    alert('沒有足夠的題目可供練習');
    return;
  }
  
  startQuiz('自訂練習');
}

// 開始測驗模式
function startExamMode() {
  // 測驗模式固定20題單選+10題複選+5題是非
  const singleQuestions = systemState.questions.filter(q => q.type === 'single_choice');
  const multiQuestions = systemState.questions.filter(q => q.type === 'multiple_choice');
  const trueFalseQuestions = systemState.questions.filter(q => q.type === 'true_false');
  
  systemState.currentQuiz = [
    ...getRandomQuestions(singleQuestions, 20),
    ...getRandomQuestions(multiQuestions, 10),
    ...getRandomQuestions(trueFalseQuestions, 5)
  ];
  
  startQuiz('正式測驗');
}

// Fisher-Yates 洗牌演算法
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 隨機選擇題目 (不重複)
function getRandomQuestions(questionPool, count) {
  if (!questionPool || questionPool.length === 0) return [];
  
  // 先洗牌再取前N個
  const shuffled = shuffleArray(questionPool);
  return shuffled.slice(0, Math.min(count, questionPool.length));
}

// 開始測驗
function startQuiz(quizType) {
  systemState.quizAnswers = [];
  systemState.quizResults = [];
  systemState.currentQuestionIndex = 0;
  
  // 更新介面
  domElements.modeSelection.style.display = 'none';
  domElements.customPractice.style.display = 'none';
  domElements.quizInterface.style.display = 'block';
  domElements.resultContainer.style.display = 'none';
  domElements.historyContainer.style.display = 'none';
  domElements.quizTitle.textContent = `${domElements.subjectSelect.selectedOptions[0].text} - ${quizType}`;
  
  // 顯示第一題
  showQuestion(0);
}

// 檢查選項是否已被選擇
function isOptionSelected(question, index, option) {
  const savedAnswer = systemState.quizAnswers[index];
  if (!savedAnswer) return false;
  
  if (question.type === 'multiple_choice') {
    return savedAnswer.userAnswer.includes(option);
  }
  return savedAnswer.userAnswer === option;
}

// 顯示題目
function showQuestion(index) {
  if (index < 0 || index >= systemState.currentQuiz.length) {
    console.error('無效的題目索引:', index);
    return;
  }

  const question = systemState.currentQuiz[index];
  systemState.currentQuestionIndex = index;

  // 更新進度顯示
  domElements.quizProgress.textContent = `題目 ${index + 1}/${systemState.currentQuiz.length}`;
  domElements.quizProgress.setAttribute('aria-label', `第 ${index + 1} 題，共 ${systemState.currentQuiz.length} 題`);
  
  // 建立選項HTML
  let optionsHtml = '';
  if (question.type === 'single_choice') {
    optionsHtml = question.options.map((option, i) => `
      <label class="option radio-option">
        <input type="radio" name="q${index}" value="${option}" id="opt-${index}-${i}"
               ${isOptionSelected(question, index, option) ? 'checked' : ''}>
        <span class="radio-checkmark"></span>
        <span class="option-text">${option}</span>
      </label>
    `).join('');
  } else if (question.type === 'multiple_choice') {
    optionsHtml = question.options.map((option, i) => `
      <label class="option checkbox-option">
        <input type="checkbox" name="q${index}" value="${option}" id="opt-${index}-${i}"
               ${isOptionSelected(question, index, option) ? 'checked' : ''}>
        <span class="checkbox-checkmark"></span>
        <span class="option-text">${option}</span>
      </label>
    `).join('');
  } else if (question.type === 'true_false') {
    optionsHtml = `
      <div class="select-dropdown">
        <select id="true-false-select-${index}">
          <option value="">-- 請選擇 --</option>
          <option value="true" ${isOptionSelected(question, index, 'true') ? 'selected' : ''}>是</option>
          <option value="false" ${isOptionSelected(question, index, 'false') ? 'selected' : ''}>否</option>
        </select>
      </div>
    `;
  }

  // 顯示題目和導航按鈕
  domElements.questionContainer.innerHTML = `
    <div class="question-text">${index + 1}. ${question.question}</div>
    <div class="options">${optionsHtml}</div>
    <div class="navigation-buttons">
      ${index > 0 ? '<button id="prev-btn" class="nav-btn">上一題</button>' : ''}
      <button id="next-btn" class="nav-btn">
        ${index === systemState.currentQuiz.length - 1 ? '提交測驗' : '下一題'}
      </button>
    </div>
  `;

  // 綁定導航事件
  bindNavigationEvents(index, question.type);
}

// 綁定導航事件
function bindNavigationEvents(index, questionType) {
  // 上一題按鈕
  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      saveAnswer(index, questionType);
      showQuestion(index - 1);
    });
  }

  // 下一題/提交按鈕
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!saveAnswer(index, questionType)) {
        alert('請先選擇答案');
        return;
      }
      
      if (index >= systemState.currentQuiz.length - 1) {
        submitQuiz();
      } else {
        showQuestion(index + 1);
      }
    });
  }

  // 單選題自動跳轉
  if (questionType === 'single_choice') {
    document.querySelectorAll(`input[name="q${index}"]`).forEach(input => {
      input.addEventListener('change', () => {
        saveAnswer(index, questionType);
        if (index < systemState.currentQuiz.length - 1) {
          setTimeout(() => showQuestion(index + 1), 500);
        }
      });
    });
  }
}

// 保存答案
function saveAnswer(index, questionType) {
  const question = systemState.currentQuiz[index];
  const userAnswer = getUserAnswer(index, questionType);
  
  // 複選題允許不選答案
  if (questionType !== 'multiple_choice' && 
      (userAnswer === null || (Array.isArray(userAnswer) && userAnswer.length === 0))) {
    return false;
  }

  systemState.quizAnswers[index] = {
    questionIndex: index,
    userAnswer: userAnswer,
    isCorrect: checkAnswer(question, userAnswer),
    questionType: question.type
  };
  
  return true;
}

// 檢查答案
function checkAnswer(question, userAnswer) {
  if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
    return false;
  }
  
  switch(question.type) {
    case 'single_choice':
      return userAnswer === question.answer;
      
    case 'multiple_choice':
      const correctAnswers = Array.isArray(question.answer) 
        ? [...question.answer].sort() 
        : [question.answer].sort();
      const userAnswers = [...userAnswer].sort();
      return JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
      
    case 'true_false':
      return userAnswer === String(question.answer);
      
    default:
      return false;
  }
}

// 獲取使用者答案
function getUserAnswer(index, questionType) {
  const question = systemState.currentQuiz[index];
  
  switch(questionType) {
    case 'single_choice':
      const radio = document.querySelector(`input[name="q${index}"]:checked`);
      return radio ? radio.value : null;
      
    case 'multiple_choice':
      const checkboxes = document.querySelectorAll(`input[name="q${index}"]:checked`);
      return Array.from(checkboxes).map(cb => cb.value);
      
    case 'true_false':
      const select = document.getElementById(`true-false-select-${index}`);
      return select ? select.value : null;
      
    default:
      return null;
  }
}

// 提交測驗
function submitQuiz() {
  // 確保最後一題答案已保存
  const lastIndex = systemState.currentQuiz.length - 1;
  const lastQuestion = systemState.currentQuiz[lastIndex];
  saveAnswer(lastIndex, lastQuestion.type);
  
  // 計算得分
  const score = calculateScore();
  const results = generateResults();
  
  // 保存歷史記錄
  saveQuizHistory(score);
  
  // 顯示結果
  displayResults(score, results);
}

// 計算分數
function calculateScore() {
  const total = systemState.quizAnswers.length;
  const correct = systemState.quizAnswers.filter(a => a.isCorrect).length;
  return Math.round((correct / total) * 100);
}

// 生成詳細結果
function generateResults() {
  return systemState.currentQuiz.map((question, index) => {
    const userAnswer = systemState.quizAnswers[index]?.userAnswer || '未作答';
    const isCorrect = systemState.quizAnswers[index]?.isCorrect;
    
    return {
      question: question.question,
      userAnswer: Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer,
      correctAnswer: Array.isArray(question.answer) ? question.answer.join(', ') : question.answer,
      isCorrect: isCorrect,
      explanation: question.explanation || ''
    };
  });
}

// 顯示結果頁面
function displayResults(score, results) {
  let html = `
    <div class="result-summary">
      <h3>測驗完成！</h3>
      <p>您的得分: <span class="${score >= 60 ? 'correct-answer' : 'wrong-answer'}">${score}分</span></p>
      <p>答對題數: ${results.filter(r => r.isCorrect).length} / ${results.length}</p>
    </div>
  `;
  
  results.forEach((result, index) => {
    html += `
      <div class="result-item ${result.isCorrect ? 'correct' : 'incorrect'}">
        <p><strong>題目 ${index + 1}:</strong> ${result.question}</p>
        <p>您的答案: <span class="${result.isCorrect ? 'correct-answer' : 'wrong-answer'}">${result.userAnswer}</span></p>
        ${!result.isCorrect ? `<p>正確答案: <span class="correct-answer">${result.correctAnswer}</span></p>` : ''}
        ${result.explanation ? `<p class="explanation">說明: ${result.explanation}</p>` : ''}
      </div>
    `;
  });
  
  domElements.resultContent.innerHTML = html;
  domElements.quizInterface.style.display = 'none';
  domElements.resultContainer.style.display = 'block';
}

// 保存歷史記錄
function saveQuizHistory(score) {
  const record = {
    date: new Date().toISOString(),
    subject: systemState.currentSubject,
    subjectName: domElements.subjectSelect.selectedOptions[0].text,
    mode: systemState.currentMode,
    score: score,
    totalQuestions: systemState.currentQuiz.length,
    correctAnswers: systemState.quizAnswers.filter(a => a.isCorrect).length,
    details: systemState.quizAnswers.map(answer => ({
      question: systemState.currentQuiz[answer.questionIndex].question,
      userAnswer: answer.userAnswer,
      isCorrect: answer.isCorrect
    }))
  };
  
  systemState.historyRecords.unshift(record);
  localStorage.setItem('quizHistory', JSON.stringify(systemState.historyRecords));
}

// 檢視錯誤題目
function reviewWrongAnswers() {
  const wrongAnswers = systemState.quizAnswers.filter(a => !a.isCorrect);
  
  if (wrongAnswers.length === 0) {
    alert('本次測驗沒有答錯的題目！');
    return;
  }
  
  // 只顯示答錯的題目
  systemState.currentQuiz = wrongAnswers.map(a => systemState.currentQuiz[a.questionIndex]);
  systemState.quizAnswers = [];
  systemState.currentQuestionIndex = 0;
  
  // 進入複習模式
  domElements.resultContainer.style.display = 'none';
  domElements.quizInterface.style.display = 'block';
  domElements.quizTitle.textContent = `${domElements.subjectSelect.selectedOptions[0].text} - 錯誤題目複習`;
  
  showQuestion(0);
}

  // 開始新測驗
function resetForNewQuiz() {
  if (systemState.currentMode === 'practice') {
    domElements.resultContainer.style.display = 'none';
    domElements.customPractice.style.display = 'block';
  } else {
    startExamMode();
  }
}

// 顯示歷史記錄
function showHistory() {
  domElements.modeSelection.style.display = 'none';
  domElements.historyContainer.style.display = 'block';
  
  if (systemState.historyRecords.length === 0) {
    domElements.historyList.innerHTML = '<p>暫無歷史記錄</p>';
    return;
  }
  
  let html = '';
  systemState.historyRecords.forEach((record, index) => {
    html += `
      <div class="history-item">
        <h4>
          <span>${record.subjectName} - ${record.mode === 'practice' ? '練習模式' : '測驗模式'}</span>
          <span class="history-time">${formatDate(record.date)}</span>
        </h4>
        <p>得分: <span class="${record.score >= 60 ? 'correct-answer' : 'wrong-answer'}">${record.score}分</span></p>
        <p>正確率: ${record.correctAnswers}/${record.totalQuestions}</p>
        <button class="detail-btn" data-index="${index}">查看詳情</button>
        <div class="history-details" id="details-${index}">
          ${generateHistoryDetails(record.details)}
        </div>
      </div>
    `;
  });
  
  domElements.historyList.innerHTML = html;
  
  // 綁定詳情按鈕事件
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      const details = document.getElementById(`details-${index}`);
      details.classList.toggle('active');
      this.textContent = details.classList.contains('active') ? '隱藏詳情' : '查看詳情';
    });
  });
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
}

// 生成歷史記錄詳情
function generateHistoryDetails(details) {
  return details.map((detail, i) => `
    <div class="question-result ${detail.isCorrect ? 'correct' : 'wrong'}">
      <p><strong>題目 ${i + 1}:</strong> ${detail.question}</p>
      <p>您的答案: <span class="${detail.isCorrect ? 'correct-answer' : 'wrong-answer'}">${
        Array.isArray(detail.userAnswer) ? detail.userAnswer.join(', ') : detail.userAnswer
      }</span></p>
    </div>
  `).join('');
}

// 返回測驗
function backToQuizFromHistory() {
  domElements.historyContainer.style.display = 'none';
  if (systemState.currentMode) {
    domElements.modeSelection.style.display = 'block';
  }
}

// 確認刪除歷史記錄
function confirmDeleteHistory() {
  if (confirm('確定要刪除所有歷史記錄嗎？此操作無法復原！')) {
    systemState.historyRecords = [];
    localStorage.removeItem('quizHistory');
    showHistory();
  }
}

// 初始化系統
initSystem();
