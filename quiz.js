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
  historyRecords: JSON.parse(localStorage.getItem('quizHistory')) || []
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
  backToQuizBtn: document.getElementById('back-to-quiz-btn')
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
}

// 登入處理
function handleLogin() {
  const password = domElements.passwordInput.value.trim();
  
  if (!password) {
    domElements.passwordError.textContent = '請輸入密碼';
    return;
  }
  
  if (password === '22143') {
    systemState.isAuthenticated = true;
    localStorage.setItem('isAuthenticated', 'true');
    domElements.authContainer.style.display = 'none';
    domElements.appContainer.style.display = 'block';
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

// 科目選擇處理
function handleSubjectSelection() {
  const subjectId = domElements.subjectSelect.value;
  
  if (!subjectId) {
    alert('請選擇科目');
    return;
  }
  
  systemState.currentSubject = subjectId;
  domElements.currentSubject.textContent = domElements.subjectSelect.selectedOptions[0].text;
  
  // 載入題庫資料
  loadSubjectData(subjectId)
    .then(data => {
      systemState.questions = data.questions;
      displaySubjectInfo(data);
      domElements.modeSelection.style.display = 'block';
    })
    .catch(error => {
      console.error('載入題庫失敗:', error);
      alert('載入題庫失敗，請稍後再試');
    });
}

// 載入科目資料
async function loadSubjectData(subjectId) {
  try {
    const response = await fetch(`data/${subjectId}.json`);
    if (!response.ok) {
      throw new Error('網路請求失敗');
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

// 隨機選擇題目
function getRandomQuestions(questionPool, count) {
  if (!questionPool || questionPool.length === 0) return [];
  
  const shuffled = [...questionPool].sort(() => 0.5 - Math.random());
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

// 顯示題目
function showQuestion(index) {
  // 檢查題目範圍
  if (index < 0 || index >= systemState.currentQuiz.length) {
    console.error('無效的題目索引:', index);
    return;
  }

  const question = systemState.currentQuiz[index];
  console.log(`顯示第 ${index} 題:`, question);

  // 更新介面
  domElements.quizProgress.textContent = `題目 ${index + 1}/${systemState.currentQuiz.length}`;
  
  // 建立選項HTML
  let optionsHtml = '';
  if (question.type === 'single_choice' || question.type === 'multiple_choice') {
    optionsHtml = question.options.map((option, i) => `
      <label class="option">
        <input type="${question.type === 'single_choice' ? 'radio' : 'checkbox'}" 
               name="q${index}" value="${option}" 
               id="opt-${index}-${i}">
        ${option}
      </label>
    `).join('');
  } else if (question.type === 'true_false') {
    optionsHtml = `
      <label class="option">
        <input type="radio" name="q${index}" value="true" id="opt-${index}-true">
        是
      </label>
      <label class="option">
        <input type="radio" name="q${index}" value="false" id="opt-${index}-false">
        否
      </label>
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
  bindNavigationEvents(index);
}

// 綁定導航事件
function bindNavigationEvents(index) {
  // 上一題按鈕
  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      saveAnswer(index);
      showQuestion(index - 1);
    });
  }

  // 下一題/提交按鈕
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!saveAnswer(index)) {
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
  if (systemState.currentQuiz[index].type === 'single_choice' || 
      systemState.currentQuiz[index].type === 'true_false') {
    document.querySelectorAll(`input[name="q${index}"]`).forEach(input => {
      input.addEventListener('change', () => {
        saveAnswer(index);
        if (index < systemState.currentQuiz.length - 1) {
          setTimeout(() => showQuestion(index + 1), 500);
        }
      });
    });
  }
}

// 保存答案
function saveAnswer(index) {
  const question = systemState.currentQuiz[index];
  const userAnswer = getUserAnswer(index, question.type);
  
  if (userAnswer === null || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
    return false;
  }

  systemState.quizAnswers[index] = {
    questionIndex: index,
    userAnswer: userAnswer,
    isCorrect: checkAnswer(question, userAnswer)
  };
  
  console.log(`已保存第 ${index} 題答案:`, userAnswer);
  return true;
}

// 獲取使用者答案
function getUserAnswer(index, questionType) {
  const inputs = document.querySelectorAll(`input[name="q${index}"]`);
  
  if (questionType === 'single_choice' || questionType === 'true_false') {
    const selected = [...inputs].find(input => input.checked);
    return selected ? selected.value : null;
  } else if (questionType === 'multiple_choice') {
    return [...inputs]
      .filter(input => input.checked)
      .map(input => input.value)
      .sort();
  }
  return null;
}

// 檢查答案
function checkAnswer(question, userAnswer) {
  if (!userAnswer) return false;
  
  if (question.type === 'true_false') {
    return userAnswer === String(question.answer);
  }
  return JSON.stringify(userAnswer) === JSON.stringify(question.answer);
}

// 提交測驗
function submitQuiz() {
  // 收集答案
  const results = [];
  let score = 0;
  
  systemState.currentQuiz.forEach((question, index) => {
    const userAnswer = systemState.quizAnswers[index]?.userAnswer || null;
    const isCorrect = checkAnswer(question, userAnswer);
    
    if (isCorrect) {
      score += question.type === 'single_choice' ? 3 : 
               question.type === 'multiple_choice' ? 4 : 2;
    }
    
    results.push({
      question: question.question,
      userAnswer,
      correctAnswer: question.answer,
      isCorrect
    });
  });
  
  systemState.quizResults = results;
  
  // 儲存歷史紀錄
  const record = {
    date: new Date().toLocaleString('zh-TW'),
    subject: systemState.currentSubject,
    score,
    total: systemState.currentQuiz.length,
    details: results
  };
  
  systemState.historyRecords.push(record);
  localStorage.setItem('quizHistory', JSON.stringify(systemState.historyRecords));
  
  // 顯示結果
  showQuizResults();
}

// 顯示測驗結果
function showQuizResults() {
  const correctCount = systemState.quizResults.filter(r => r.isCorrect).length;
  const totalQuestions = systemState.currentQuiz.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  
  let resultsHtml = `
    <div class="result-summary">
      <h3>測驗結果</h3>
      <p>科目：${domElements.subjectSelect.selectedOptions[0].text}</p>
      <p>答對題數：<strong>${correctCount}/${totalQuestions}</strong></p>
      <p>正確率：<strong>${percentage}%</strong></p>
    </div>
    <div class="result-details">
      <h4>詳細結果：</h4>
  `;
  
  systemState.quizResults.forEach((result, index) => {
    resultsHtml += `
      <div class="result-item ${result.isCorrect ? 'correct' : 'incorrect'}">
        <p><strong>第 ${index + 1} 題</strong>：${result.question}</p>
        <p>你的答案：${formatAnswer(result.userAnswer)}</p>
        <p>正確答案：${formatAnswer(result.correctAnswer)}</p>
        <p class="${result.isCorrect ? 'correct-answer' : 'wrong-answer'}">
          ${result.isCorrect ? '✓ 答對了' : '✗ 答錯了'}
        </p>
      </div>
      <hr>
    `;
  });
  
  resultsHtml += `</div>`;
  
  domElements.resultContent.innerHTML = resultsHtml;
  domElements.quizInterface.style.display = 'none';
  domElements.resultContainer.style.display = 'block';
}

// 格式化答案顯示
function formatAnswer(answer) {
  if (!answer) return '未作答';
  if (Array.isArray(answer)) return answer.join('、');
  return answer;
}

// 檢視錯誤題目
function reviewWrongAnswers() {
  const wrongAnswers = systemState.quizResults.filter(r => !r.isCorrect);
  
  if (wrongAnswers.length === 0) {
    alert('恭喜！本次測驗全部答對！');
    return;
  }
  
  let reviewHtml = '<h3>錯誤題目檢視：</h3>';
  
  wrongAnswers.forEach((item, index) => {
    reviewHtml += `
      <div class="review-item">
        <p><strong>錯誤題目 ${index + 1}</strong>：${item.question}</p>
        <p>你的答案：${formatAnswer(item.userAnswer)}</p>
        <p>正確答案：${formatAnswer(item.correctAnswer)}</p>
      </div>
      <hr>
    `;
  });
  
  domElements.resultContent.innerHTML = reviewHtml;
}

// 顯示歷史紀錄
function showHistory() {
  domElements.modeSelection.style.display = 'none';
  domElements.subjectInfo.style.display = 'none';
  domElements.historyContainer.style.display = 'block';
  
  const historyHtml = systemState.historyRecords.map((record, idx) => `
    <div class="history-item">
      <h4>測驗記錄 #${idx + 1}</h4>
      <p>日期：${record.date}</p>
      <p>科目：${record.subject}</p>
      <p>得分：${record.score} / ${record.total}</p>
      <button class="detail-btn" data-index="${idx}">查看詳情</button>
    </div>
    <hr>
  `).join('');
  
  domElements.historyList.innerHTML = historyHtml || '<p>尚無歷史紀錄</p>';
  
  // 綁定查看詳情按鈕
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = this.getAttribute('data-index');
      showHistoryDetail(index);
    });
  });
}

// 顯示歷史詳情
function showHistoryDetail(index) {
  const record = systemState.historyRecords[index];
  let detailHtml = `
    <h3>測驗詳情 - ${record.date}</h3>
    <p>科目：${record.subject}</p>
    <p>得分：${record.score} / ${record.total}</p>
    <div class="history-details">
  `;
  
  record.details.forEach((item, qIdx) => {
    detailHtml += `
      <div class="question-result ${item.isCorrect ? 'correct' : 'wrong'}">
        <p><strong>第 ${qIdx + 1} 題</strong>: ${item.question}</p>
        <p>你的答案: ${formatAnswer(item.userAnswer)}</p>
        <p>正確答案: ${formatAnswer(item.correctAnswer)}</p>
        <p>${item.isCorrect ? '✓ 正確' : '✗ 錯誤'}</p>
      </div>
    `;
  });
  
  detailHtml += `</div><button id="back-to-history" class="main-btn">返回歷史列表</button>`;
  domElements.historyList.innerHTML = detailHtml;
  
  document.getElementById('back-to-history').addEventListener('click', showHistory);
}

// 返回測驗從歷史紀錄
function backToQuizFromHistory() {
  domElements.historyContainer.style.display = 'none';
  domElements.modeSelection.style.display = 'block';
}

// 重置系統狀態
function resetSystemState() {
  systemState.currentSubject = null;
  systemState.currentMode = null;
  systemState.questions = [];
  systemState.currentQuiz = [];
  systemState.quizAnswers = [];
  systemState.quizResults = [];
  systemState.currentQuestionIndex = 0;
  
  // 重置UI
  domElements.subjectSelect.value = '';
  domElements.currentSubject.textContent = '';
  domElements.subjectInfo.style.display = 'none';
  domElements.modeSelection.style.display = 'none';
  domElements.customPractice.style.display = 'none';
  domElements.quizInterface.style.display = 'none';
  domElements.resultContainer.style.display = 'none';
  domElements.historyContainer.style.display = 'none';
}

// 開始新測驗
function resetForNewQuiz() {
  systemState.currentQuiz = [];
  systemState.quizAnswers = [];
  systemState.quizResults = [];
  systemState.currentQuestionIndex = 0;
  
  domElements.resultContainer.style.display = 'none';
  domElements.modeSelection.style.display = 'block';
}

// 系統初始化
document.addEventListener('DOMContentLoaded', initSystem);
