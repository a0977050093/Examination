// 系統狀態變數
const applicationState = {
  currentUser: null,
  loggedIn: false,
  selectedTopic: null,
  activeMode: null,
  questionBank: [],
  activeQuiz: [],
  currentQuestionIdx: 0,
  responses: [],
  quizResults: [],
  historyLogs: JSON.parse(localStorage.getItem('quizHistory')) || [],
  loadingStatus: false,
  errorMessage: null
};

// 獲取 DOM 元素
const domElements = {
  // 登入區
  loadingIndicator: document.getElementById('loading-overlay'),
  authenticationContainer: document.getElementById('auth-container'),
  userPasswordInput: document.getElementById('password-input'),
  passwordErrorMessage: document.getElementById('password-error'),
  signInButton: document.getElementById('login-btn'),
  
  // 主界面
  mainContainer: document.getElementById('app-container'),
  signOutButton: document.getElementById('logout-btn'),
  displayedTopic: document.getElementById('current-subject'),
  
  // 科目選擇
  topicSelection: document.getElementById('subject-select'),
  chooseTopicButton: document.getElementById('select-subject-btn'),
  topicInformation: document.getElementById('subject-info'),
  topicStatistics: document.getElementById('subject-details'),
  
  // 模式選擇
  modeSelectionArea: document.getElementById('mode-selection'),
  practiceModeButton: document.getElementById('practice-mode-btn'),
  examModeButton: document.getElementById('exam-mode-btn'),
  historyButton: document.getElementById('history-btn'),
  
  // 練習設置
  customPracticeArea: document.getElementById('custom-practice'),
  singleChoiceQuantity: document.getElementById('single-count'),
  multipleChoiceQuantity: document.getElementById('multi-count'),
  initiatePracticeButton: document.getElementById('start-practice-btn'),
  
  // 測驗界面
  quizContainer: document.getElementById('quiz-interface'),
  quizHeader: document.getElementById('quiz-title'),
  quizProgressIndicator: document.getElementById('quiz-progress'),
  questionArea: document.getElementById('question-container'),
  
  // 結果顯示區
  resultContainer: document.getElementById('result-container'),
  resultContent: document.getElementById('result-content'),
  reviewIncorrectButton: document.getElementById('review-btn'),
  restartQuizButton: document.getElementById('new-quiz-btn'),
  
  // 歷史紀錄
  historyContainer: document.getElementById('history-container'),
  historyList: document.getElementById('history-list'),
  returnToQuizButton: document.getElementById('back-to-quiz-btn'),
  clearHistoryButton: document.getElementById('delete-history-btn')
};

// 初始化應用程序
function initializeApplication() {
  // 模擬加載過程
  setTimeout(() => {
    domElements.loadingIndicator.style.display = 'none';
    
    // 檢查用戶登入狀態
    if (localStorage.getItem('isAuthenticated') === 'true') {
      applicationState.loggedIn = true;
      domElements.authenticationContainer.style.display = 'none';
      domElements.mainContainer.style.display = 'block';
    } else {
      domElements.authenticationContainer.style.display = 'flex';
    }
  }, 1500);
  
  // 綁定事件監聽器
  bindEventListeners();
}

// 綁定所有事件監聽器
function bindEventListeners() {
  // 登入相關
  domElements.signInButton.addEventListener('click', handleLogin);
  domElements.userPasswordInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') handleLogin();
  });
  domElements.signOutButton.addEventListener('click', handleLogout);
  
  // 科目選擇
  domElements.chooseTopicButton.addEventListener('click', handleTopicSelection);
  
  // 模式選擇
  domElements.practiceModeButton.addEventListener('click', () => selectMode('practice'));
  domElements.examModeButton.addEventListener('click', () => selectMode('exam'));
  domElements.historyButton.addEventListener('click', displayHistory);
  
  // 練習設置
  domElements.initiatePracticeButton.addEventListener('click', startCustomPractice);
  
  // 結果顯示
  domElements.reviewIncorrectButton.addEventListener('click', reviewWrongAnswers);
  domElements.restartQuizButton.addEventListener('click', resetForNewQuiz);
  
  // 歷史紀錄
  domElements.returnToQuizButton.addEventListener('click', returnToQuizFromHistory);
  domElements.clearHistoryButton.addEventListener('click', confirmDeleteHistory);
  
  // 複選題自動保存用戶答案
  document.addEventListener('change', function(event) {
    if (event.target.type === 'checkbox' && 
        event.target.name.startsWith('q') && 
        applicationState.activeMode) {
      const index = parseInt(event.target.name.substring(1));
      saveUserAnswer(index, 'multiple_choice');
    }
  });
}

// 登入處理
function handleLogin() {
  const password = domElements.userPasswordInput.value.trim();
  
  if (!password) {
    domElements.passwordErrorMessage.textContent = '請輸入密碼';
    domElements.userPasswordInput.focus();
    return;
  }
  
  // 實務上應使用雜湊比對而非明文
  if (password === '22143') {
    applicationState.loggedIn = true;
    localStorage.setItem('isAuthenticated', 'true');
    domElements.authenticationContainer.style.display = 'none';
    domElements.mainContainer.style.display = 'block';
    domElements.userPasswordInput.value = '';
    domElements.passwordErrorMessage.textContent = '';
  } else {
    domElements.passwordErrorMessage.textContent = '密碼錯誤，請重新輸入';
    domElements.userPasswordInput.value = '';
    domElements.userPasswordInput.focus();
  }
}

// 登出處理
function handleLogout() {
  applicationState.loggedIn = false;
  localStorage.removeItem('isAuthenticated');
  domElements.mainContainer.style.display = 'none';
  domElements.authenticationContainer.style.display = 'flex';
  domElements.userPasswordInput.value = '';
  resetApplicationState();
}

// 重置應用程序狀態
function resetApplicationState() {
  applicationState.selectedTopic = null;
  applicationState.activeMode = null;
  applicationState.questionBank = [];
  applicationState.activeQuiz = [];
  applicationState.currentQuestionIdx = 0;
  applicationState.responses = [];
  applicationState.quizResults = [];
  
  // 重置 UI
  domElements.topicSelection.value = '';
  domElements.topicInformation.style.display = 'none';
  domElements.modeSelectionArea.style.display = 'none';
  domElements.customPracticeArea.style.display = 'none';
  domElements.quizContainer.style.display = 'none';
  domElements.resultContainer.style.display = 'none';
  domElements.historyContainer.style.display = 'none';
  domElements.displayedTopic.textContent = '';
}

// 科目選擇處理
async function handleTopicSelection() {
  const topicId = domElements.topicSelection.value;
  
  if (!topicId) {
    alert('請選擇科目');
    return;
  }
  
  applicationState.selectedTopic = topicId;
  domElements.displayedTopic.textContent = domElements.topicSelection.selectedOptions[0].text;
  
  try {
    // 顯示加載狀態
    applicationState.loadingStatus = true;
    domElements.loadingIndicator.style.display = 'flex';
    
    // 載入題庫數據
    const data = await fetchTopicData(topicId);
    applicationState.questionBank = data.questions;
    
    displayTopicInfo(data);
    domElements.modeSelectionArea.style.display = 'block';
  } catch (error) {
    console.error('載入題庫失敗:', error);
    domElements.topicStatistics.innerHTML = `
      <p class="error">載入題庫失敗: ${error.message || '請稍後再試'}</p>
    `;
  } finally {
    applicationState.loadingStatus = false;
    domElements.loadingIndicator.style.display = 'none';
  }
}

// 載入科目數據
async function fetchTopicData(topicId) {
  try {
    const response = await fetch(`data/${topicId}.json`);
    if (!response.ok) {
      throw new Error(`網絡請求失敗: ${response.status}`);
    }
    const data = await response.json();
    console.log('載入的題庫數據:', data); // 查看完整的題庫數據

    // 確保題庫格式正確
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('題庫格式錯誤，請檢查題庫結構');
    }
    
    data.questions.forEach((q, idx) => {
      if (!q.options || !Array.isArray(q.options)) {
        console.error(`問題 ${idx + 1} 的選項格式不正確:`, q);
        throw new Error('題庫格式錯誤，請檢查每個問題的選項');
      }
    });

    return data;
  } catch (error) {
    console.error('載入題庫失敗:', error);
    throw error;
  }
}

// 顯示科目信息
function displayTopicInfo(data) {
  const singleChoiceCount = data.questions.filter(q => q.type === "single_choice").length;
  const multipleChoiceCount = data.questions.filter(q => q.type === "multiple_choice").length;
  const trueFalseCount = data.questions.filter(q => q.type === "true_false").length;
  
  domElements.topicStatistics.innerHTML = `
    <p><strong>題庫統計：</strong></p>
    <ul>
      <li>單選題：${singleChoiceCount} 題</li>
      <li>複選題：${multipleChoiceCount} 題</li>
      <li>是非題：${trueFalseCount} 題</li>
      <li>總題數：${data.questions.length} 題</li>
    </ul>
    <p>請選擇測驗模式開始練習或測驗</p>
  `;
  
  domElements.topicInformation.style.display = 'block';
}

// 選擇模式
function selectMode(mode) {
  applicationState.activeMode = mode;
  
  if (mode === 'practice') {
    domElements.customPracticeArea.style.display = 'block';
    domElements.quizContainer.style.display = 'none';
    domElements.resultContainer.style.display = 'none';
    domElements.historyContainer.style.display = 'none';
  } else {
    startExamMode();
  }
}

// 開始自訂練習
function startCustomPractice() {
  const singleCount = parseInt(domElements.singleChoiceQuantity.value) || 0;
  const multipleCount = parseInt(domElements.multipleChoiceQuantity.value) || 0;
  const trueFalseCount = 0; // 可以設定為0，因為自訂練習不一定需要是非題

  if (singleCount + multipleCount === 0) {
    alert('請設定至少一種題型的數量');
    return;
  }
  
  // 篩選題目
  const singleQuestions = applicationState.questionBank.filter(q => q.type === 'single_choice');
  const multipleQuestions = applicationState.questionBank.filter(q => q.type === 'multiple_choice');
  const trueFalseQuestions = applicationState.questionBank.filter(q => q.type === 'true_false');
  
  // 隨機選擇題目
  applicationState.activeQuiz = [
    ...getRandomQuestions(singleQuestions, Math.min(singleCount, singleQuestions.length)),
    ...getRandomQuestions(multipleQuestions, Math.min(multipleCount, multipleQuestions.length)),
    ...getRandomQuestions(trueFalseQuestions, Math.min(trueFalseCount, trueFalseQuestions.length))
  ];
  
  // 檢查是否有題目可供練習
  if (applicationState.activeQuiz.length === 0) {
    alert('沒有足夠的題目可供練習');
    return;
  }
  
  startQuiz('自訂練習');
}

// 開始考試模式
function startExamMode() {
  // 測驗模式固定20題單選+10題複選+5題是非
  const singleQuestions = applicationState.questionBank.filter(q => q.type === 'single_choice');
  const multipleQuestions = applicationState.questionBank.filter(q => q.type === 'multiple_choice');
  const trueFalseQuestions = applicationState.questionBank.filter(q => q.type === 'true_false');
  
  // 檢查是否有足夠的題目
  const requiredSingle = 20;
  const requiredMulti = 10;
  const requiredTrueFalse = 5;

  if (singleQuestions.length < requiredSingle) {
      console.warn('沒有足夠的單選題來滿足測驗要求');
  }
  if (multipleQuestions.length < requiredMulti) {
      console.warn('沒有足夠的複選題來滿足測驗要求');
  }
  if (trueFalseQuestions.length < requiredTrueFalse) {
      console.warn('沒有足夠的是非題來滿足測驗要求');
  }
  
  // 隨機選擇題目
  applicationState.activeQuiz = [
    ...getRandomQuestions(singleQuestions, Math.min(requiredSingle, singleQuestions.length)),
    ...getRandomQuestions(multipleQuestions, Math.min(requiredMulti, multipleQuestions.length)),
    ...getRandomQuestions(trueFalseQuestions, Math.min(requiredTrueFalse, trueFalseQuestions.length))
  ];
  
  // 檢查是否有題目可供測驗
  if (applicationState.activeQuiz.length === 0) {
      alert('沒有足夠的題目可供測驗');
      return;
  }

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
  applicationState.responses = [];
  applicationState.quizResults = [];
  applicationState.currentQuestionIdx = 0;
  
  // 更新介面
  domElements.modeSelectionArea.style.display = 'none';
  domElements.customPracticeArea.style.display = 'none';
  domElements.quizContainer.style.display = 'block';
  domElements.resultContainer.style.display = 'none';
  domElements.historyContainer.style.display = 'none';
  domElements.quizHeader.textContent = `${domElements.topicSelection.selectedOptions[0].text} - ${quizType}`;
  
  // 顯示第一題
  displayQuestion(0);
}

// 檢查選項是否已被選擇
function isOptionSelected(question, index, option) {
  const savedResponse = applicationState.responses[index];
  if (!savedResponse) return false;
  
  if (question.type === 'multiple_choice') {
    return savedResponse.userAnswer.includes(option);
  }
  return savedResponse.userAnswer === option;
}

// 顯示題目
function displayQuestion(index) {
  if (index < 0 || index >= applicationState.activeQuiz.length) {
    console.error('無效的題目索引:', index);
    return;
  }

  const question = applicationState.activeQuiz[index];
  applicationState.currentQuestionIdx = index;

  // 更新進度顯示
  domElements.quizProgressIndicator.textContent = `題目 ${index + 1}/${applicationState.activeQuiz.length}`;
  domElements.quizProgressIndicator.setAttribute('aria-label', `第 ${index + 1} 題，共 ${applicationState.activeQuiz.length} 題`);

  // 檢查選項
  if (!Array.isArray(question.options)) {
    console.error('question.options 不是可迭代的:', question.options);
    return; // 或者處理錯誤
  }

  // 複製選項陣列並隨機排序
  let randomizedOptions = [...question.options];
  if (question.type !== 'true_false') {
    randomizedOptions = shuffleArray([...question.options]);
  }

  // 建立選項HTML
  let optionsHtml = '';
  if (question.type === 'single_choice') {
    optionsHtml = randomizedOptions.map((option, i) => `
      <label class="option radio-option">
        <input type="radio" name="q${index}" value="${option}" id="opt-${index}-${i}"
               ${isOptionSelected(question, index, option) ? 'checked' : ''}>
        <span class="option-checkmark"></span>
        <span class="option-text">${option}</span>
      </label>
    `).join('');
  } else if (question.type === 'multiple_choice') {
    optionsHtml = randomizedOptions.map((option, i) => `
      <label class="option checkbox-option">
        <input type="checkbox" name="q${index}" value="${option}" id="opt-${index}-${i}"
               ${isOptionSelected(question, index, option) ? 'checked' : ''}>
        <span class="option-checkmark"></span>
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
  domElements.questionArea.innerHTML = `
    <div class="question-text">${index + 1}. ${question.question}</div>
    <div class="options">${optionsHtml}</div>
    <div class="navigation-buttons">
      ${index > 0 ? '<button id="prev-btn" class="nav-btn">上一題</button>' : ''}
      <button id="next-btn" class="nav-btn">
        ${index === applicationState.activeQuiz.length - 1 ? '提交測驗' : '下一題'}
      </button>
    </div>
  `;

  // 綁定導航事件
  bindNavigationEvents(index, question.type);
}

// 綁定導航事件
function bindNavigationEvents(index, questionType) {
  // 上一題按鈕
  const prevButton = document.getElementById('prev-btn');
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      saveUserAnswer(index, questionType);
      displayQuestion(index - 1);
    });
  }

  // 下一題/提交按鈕
  const nextButton = document.getElementById('next-btn');
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (!saveUserAnswer(index, questionType)) {
        alert('請先選擇答案');
        return;
      }
      
      if (index >= applicationState.activeQuiz.length - 1) {
        submitQuiz();
      } else {
        displayQuestion(index + 1);
      }
    });
  }

  // 單選題自動跳轉
  if (questionType === 'single_choice') {
    document.querySelectorAll(`input[name="q${index}"]`).forEach(input => {
      input.addEventListener('change', () => {
        saveUserAnswer(index, questionType);
        if (index < applicationState.activeQuiz.length - 1) {
          setTimeout(() => displayQuestion(index + 1), 500);
        }
      });
    });
  }
}

// 保存用戶答案
function saveUserAnswer(index, questionType) {
  const question = applicationState.activeQuiz[index];
  const answer = getUserResponse(index, questionType);
  
  // 複選題允許不選答案
  if (questionType !== 'multiple_choice' && 
      (answer === null || (Array.isArray(answer) && answer.length === 0))) {
    return false;
  }

  applicationState.responses[index] = {
    questionIndex: index,
    userAnswer: answer,
    isCorrect: validateAnswer(question, answer),
    questionType: question.type
  };
  
  return true;
}

// 驗證答案
function validateAnswer(question, userAnswer) {
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
      const submittedAnswers = [...userAnswer].sort();
      return JSON.stringify(submittedAnswers) === JSON.stringify(correctAnswers);
      
    case 'true_false':
      return userAnswer === String(question.answer);
      
    default:
      return false;
  }
}

// 獲取用戶答案
function getUserResponse(index, questionType) {
  const question = applicationState.activeQuiz[index];
  
  switch(questionType) {
    case 'single_choice':
      const radioButton = document.querySelector(`input[name="q${index}"]:checked`);
      return radioButton ? radioButton.value : null;
      
    case 'multiple_choice':
      const selectedCheckboxes = document.querySelectorAll(`input[name="q${index}"]:checked`);
      return Array.from(selectedCheckboxes).map(cb => cb.value);
      
    case 'true_false':
      const selectElement = document.getElementById(`true-false-select-${index}`);
      return selectElement ? selectElement.value : null;
      
    default:
      return null;
  }
}

// 提交測驗
function submitQuiz() {
  // 確保最後一題的答案已保存
  const lastQuestionIndex = applicationState.activeQuiz.length - 1;
  const lastQuestion = applicationState.activeQuiz[lastQuestionIndex];
  saveUserAnswer(lastQuestionIndex, lastQuestion.type);
  
  // 計算得分
  const totalScore = computeScore();
  const resultsSummary = compileResults();
  
  // 保存歷史紀錄
  recordQuizHistory(totalScore);
  
  // 顯示結果
  renderResults(totalScore, resultsSummary);
}

// 計算分數
function computeScore() {
  const totalQuestions = applicationState.responses.length;
  const correctResponses = applicationState.responses.filter(a => a.isCorrect).length;
  return Math.round((correctResponses / totalQuestions) * 100);
}

// 編纂詳細結果
function compileResults() {
  return applicationState.activeQuiz.map((question, index) => {
    const userAnswer = applicationState.responses[index]?.userAnswer || '未作答';
    const isCorrect = applicationState.responses[index]?.isCorrect;
    
    return {
      question: question.question,
      userAnswer: Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer,
      correctAnswer: Array.isArray(question.answer) ? question.answer.join(', ') : question.answer,
      isCorrect: isCorrect,
      explanation: question.explanation || ''
    };
  });
}

// 渲染結果頁面
function renderResults(score, results) {
  let htmlContent = `
    <div class="result-summary">
      <h3>測驗完成！</h3>
      <p>您的得分: <span class="${score >= 60 ? 'correct-answer' : 'wrong-answer'}">${score}分</span></p>
      <p>答對題數: ${results.filter(r => r.isCorrect).lengt} / ${results.length}</p>
    </div>
  `;
  
  results.forEach((result, index) => {
    htmlContent += `
      <div class="result-item ${result.isCorrect ? 'correct' : 'incorrect'}">
        <p><strong>題目 ${index + 1}:</strong> ${result.question}</p>
        <p>您的答案: <span class="${result.isCorrect ? 'correct-answer' : 'wrong-answer'}">${result.userAnswer}</span></p>
        ${!result.isCorrect ? `<p>正確答案: <span class="correct-answer">${result.correctAnswer}</span></p>` : ''}
        ${result.explanation ? `<p class="explanation">說明: ${result.explanation}</p>` : ''}
      </div>
    `;
  });
  
  domElements.resultContent.innerHTML = htmlContent;
  domElements.quizContainer.style.display = 'none';
  domElements.resultContainer.style.display = 'block';
}

// 保存歷史紀錄
function recordQuizHistory(score) {
  const historyEntry = {
    date: new Date().toISOString(),
    topic: applicationState.selectedTopic,
    topicName: domElements.topicSelection.selectedOptions[0].text,
    mode: applicationState.activeMode,
    score: score,
    totalQuestions: applicationState.activeQuiz.length,
    correctAnswers: applicationState.responses.filter(a => a.isCorrect).length,
    details: applicationState.responses.map(response => ({
      question: applicationState.activeQuiz[response.questionIndex].question,
      userAnswer: response.userAnswer,
      isCorrect: response.isCorrect
    }))
  };
  
  applicationState.historyLogs.unshift(historyEntry);
  localStorage.setItem('quizHistory', JSON.stringify(applicationState.historyLogs));
}

// 檢視錯誤題目
function reviewWrongAnswers() {
  const incorrectAnswers = applicationState.responses.filter(a => !a.isCorrect);
  
  if (incorrectAnswers.length === 0) {
    alert('本次測驗沒有答錯的題目！');
    return;
  }
  
  // 只顯示答錯的題目
  applicationState.activeQuiz = incorrectAnswers.map(a => applicationState.activeQuiz[a.questionIndex]);
  applicationState.responses = [];
  applicationState.currentQuestionIdx = 0;
  
  // 進入複習模式
  domElements.resultContainer.style.display = 'none';
  domElements.quizContainer.style.display = 'block';
  domElements.quizHeader.textContent = `${domElements.topicSelection.selectedOptions[0].text} - 錯誤題目複習`;
  
  displayQuestion(0);
}

// 顯示歷史紀錄
function displayHistory() {
  // 清空歷史紀錄列表
  domElements.historyList.innerHTML = '';
  
  if (applicationState.historyLogs.length === 0) {
    domElements.historyList.innerHTML = '<p>沒有歷史紀錄。</p>';
    return;
  }
  
  applicationState.historyLogs.forEach(record => {
    const listItem = document.createElement('li');
    listItem.textContent = `${record.date}: ${record.topicName} - ${record.score}分`;
    domElements.historyList.appendChild(listItem);
  });

  domElements.historyContainer.style.display = 'block';
}

// 返回測驗介面
function returnToQuizFromHistory() {
  domElements.historyContainer.style.display = 'none';
  domElements.modeSelectionArea.style.display = 'block';
}

// 確認刪除歷史紀錄
function confirmDeleteHistory() {
  if (confirm('確定要刪除所有歷史紀錄嗎？')) {
    localStorage.removeItem('quizHistory');
    applicationState.historyLogs = [];
    displayHistory();
  }
}

// 執行初始化
initializeApplication();
