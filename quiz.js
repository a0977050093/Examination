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
    loadingOverlay: document.getElementById('loading-overlay'),
    authContainer: document.getElementById('auth-container'),
    passwordInput: document.getElementById('password-input'),
    passwordError: document.getElementById('password-error'),
    loginBtn: document.getElementById('login-btn'),

    appContainer: document.getElementById('app-container'),
    logoutBtn: document.getElementById('logout-btn'),
    currentSubject: document.getElementById('current-subject'),

    subjectSelect: document.getElementById('subject-select'),
    selectSubjectBtn: document.getElementById('select-subject-btn'),
    subjectInfo: document.getElementById('subject-info'),
    subjectDetails: document.getElementById('subject-details'),

    modeSelection: document.getElementById('mode-selection'),
    practiceModeBtn: document.getElementById('practice-mode-btn'),
    examModeBtn: document.getElementById('exam-mode-btn'),
    historyBtn: document.getElementById('history-btn'),

    customPractice: document.getElementById('custom-practice'),
    true_falseCount: document.getElementById('true_false_count'),
    singleCount: document.getElementById('single_count'),
    multiCount: document.getElementById('multi_count'),
    startPracticeBtn: document.getElementById('start-practice-btn'),

    quizInterface: document.getElementById('quiz-interface'),
    quizTitle: document.getElementById('quiz-title'),
    quizProgress: document.getElementById('quiz-progress'),
    questionContainer: document.getElementById('question-container'),

    resultContainer: document.getElementById('result-container'),
    resultContent: document.getElementById('result-content'),
    reviewBtn: document.getElementById('review-btn'),
    newQuizBtn: document.getElementById('new-quiz-btn'),

    historyContainer: document.getElementById('history-container'),
    historyList: document.getElementById('history-list'),
    backToQuizBtn: document.getElementById('back-to-quiz-btn'),
    deleteHistoryBtn: document.getElementById('delete-history-btn')
};

// 初始化系統
function initSystem() {
    setTimeout(() => {
        domElements.loadingOverlay.style.display = 'none';

        systemState.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        domElements.authContainer.style.display = systemState.isAuthenticated ? 'none' : 'flex';
        domElements.appContainer.style.display = systemState.isAuthenticated ? 'block' : 'none';
    }, 1500);
    
    bindEventListeners();
}

// 綁定所有事件監聽器
function bindEventListeners() {
    domElements.loginBtn.addEventListener('click', handleLogin);
    domElements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    domElements.logoutBtn.addEventListener('click', handleLogout);

    domElements.selectSubjectBtn.addEventListener('click', handleSubjectSelection);
    
    domElements.practiceModeBtn.addEventListener('click', () => selectMode('practice'));
    domElements.examModeBtn.addEventListener('click', () => selectMode('exam'));
    domElements.historyBtn.addEventListener('click', showHistory);

    domElements.startPracticeBtn.addEventListener('click', startCustomPractice);
    
    domElements.reviewBtn.addEventListener('click', reviewWrongAnswers);
    domElements.newQuizBtn.addEventListener('click', resetForNewQuiz);

    domElements.backToQuizBtn.addEventListener('click', backToQuizFromHistory);
    domElements.deleteHistoryBtn.addEventListener('click', confirmDeleteHistory);
}

// 登入處理
function handleLogin() {
    const password = domElements.passwordInput.value.trim();
  
    if (!password) {
        domElements.passwordError.textContent = '請輸入密碼';
        domElements.passwordInput.focus();
        return;
    }

    if (password === '348362') {
        systemState.isAuthenticated = true;
        localStorage.setItem('isAuthenticated', 'true');
        domElements.authContainer.style.display = 'none';
        domElements.appContainer.style.display = 'block';
        domElements.passwordInput.value = '';
        domElements.passwordError.textContent = '';
        
        // 讓用戶選擇是否啟用音樂
        if (confirm("您希望啟用背景音樂嗎？")) {
            const music = document.getElementById('background-music');
            music.play(); // 播放音樂
            music.loop = true; // 音樂無限循環
        }
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
        systemState.isLoading = true;
        domElements.loadingOverlay.style.display = 'flex';

        const data = await loadSubjectData(subjectId);
        systemState.questions = data.questions;

        // 顯示題型的可用性
        const availableTypes = {
            true_false: false,
            single_choice: false,
            multiple_choice: false
        };
        
        for (const question of systemState.questions) {
            if (question.type === 'true_false') {
                availableTypes.true_false = true;
            } else if (question.type === 'single_choice') {
                availableTypes.single_choice = true;
            } else if (question.type === 'multiple_choice') {
                availableTypes.multiple_choice = true;
            }
        }

        // 設置自訂練習的題型選項顯示或隱藏
        domElements.true_falseCount.disabled = !availableTypes.true_false;
        domElements.singleCount.disabled = !availableTypes.single_choice;
        domElements.multiCount.disabled = !availableTypes.multiple_choice;

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
    const truefalseCount = data.questions.filter(q => q.type === "true_false").length;
    const singleChoiceCount = data.questions.filter(q => q.type === "single_choice").length;
    const multiChoiceCount = data.questions.filter(q => q.type === "multiple_choice").length;
    
    domElements.subjectDetails.innerHTML = `
    <p><strong>題庫統計：</strong></p>
    <ul>
        <li>是非題：${truefalseCount} 題</li>
        <li>單選題：${singleChoiceCount} 題</li>
        <li>複選題：${multiChoiceCount} 題</li>
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
    } else {
        startExamMode();
    }
}

// 開始自訂練習
function startCustomPractice() {
    const true_falseCount = parseInt(domElements.true_falseCount.value) || 0;
    const singleCount = parseInt(domElements.singleCount.value) || 0;
    const multiCount = parseInt(domElements.multiCount.value) || 0;

    // 篩選題目
    const true_falseQuestions = systemState.questions.filter(q => q.type === 'true_false');
    const singleQuestions = systemState.questions.filter(q => q.type === 'single_choice');
    const multiQuestions = systemState.questions.filter(q => q.type === 'multiple_choice');

    // 檢查可用題型數量
    if (true_falseCount > true_falseQuestions.length) {
        alert(`可用的是非題數量為 ${true_falseQuestions.length}，請重新設定。`);
        return;
    }
    if (singleCount > singleQuestions.length) {
        alert(`可用的單選題數量為 ${singleQuestions.length}，請重新設定。`);
        return;
    }
    if (multiCount > multiQuestions.length) {
        alert(`可用的複選題數量為 ${multiQuestions.length}，請重新設定。`);
        return;
    }

    // 檢查題庫類型設定
    if (true_falseCount > 0 && !true_falseQuestions.length) {
        alert('所選題庫中沒有是非題，請選擇另一個題庫或調整設定。');
        return;
    }
    if (singleCount > 0 && !singleQuestions.length) {
        alert('所選題庫中沒有單選題，請選擇另一個題庫或調整設定。');
        return;
    }
    if (multiCount > 0 && !multiQuestions.length) {
        alert('所選題庫中沒有複選題，請選擇另一個題庫或調整設定。');
        return;
    }

    // 隨機選擇題目
    systemState.currentQuiz = [
        ...getRandomQuestions(true_falseQuestions, true_falseCount),
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
    // 測驗模式固定20題單選+10題複選+10題是非
    const singleQuestions = systemState.questions.filter(q => q.type === 'single_choice');
    const multiQuestions = systemState.questions.filter(q => q.type === 'multiple_choice');
    const trueFalseQuestions = systemState.questions.filter(q => q.type === 'true_false');
    
    systemState.currentQuiz = [
        ...getRandomQuestions(singleQuestions, 20),
        ...getRandomQuestions(multiQuestions, 10),
        ...getRandomQuestions(trueFalseQuestions, 10)
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

// 顯示題目 (使用圓形核選框顯示是非題)
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

    // 檢查 options 是否存在且為數組
    let randomizedOptions = [];
    if (question.options && Array.isArray(question.options)) {
        randomizedOptions = shuffleArray([...question.options]);
    } else if (question.type === 'true_false') {
        randomizedOptions = ["是", "否"]; // 對於是非題，給予預設選項
    } else {
        console.error('Question options not found or not iterable:', question);
        return;
    }

    // 建立選項HTML
    let optionsHtml = '';

    // 單選題選項
    if (question.type === 'single_choice') {
        optionsHtml = randomizedOptions.map((option, i) => `
        <label class="option radio-option">
            <input type="radio" name="q${index}" value="${option}" id="opt-${index}-${i}" ${isOptionSelected(question, index, option) ? 'checked' : ''}>
            <span class="option-checkmark"></span>
            <span class="option-text">${option}</span>
        </label>
        `).join('');
    } 
    // 複選題選擇
    else if (question.type === 'multiple_choice') {
        optionsHtml = randomizedOptions.map((option, i) => `
        <label class="option checkbox-option">
            <input type="checkbox" name="q${index}" value="${option}" id="opt-${index}-${i}" ${isOptionSelected(question, index, option) ? 'checked' : ''}>
            <span class="option-checkmark"></span>
            <span class="option-text">${option}</span>
        </label>
        `).join('');
    } else if (question.type === 'true_false') {
        optionsHtml = `
        <label class="option radio-option">
            <input type="radio" name="q${index}" value="true" id="true-${index}" ${isOptionSelected(question, index, 'true') ? 'checked' : ''}>
            <span class="option-checkmark"></span>
            <span class="option-text">是</span>
        </label>
        <label class="option radio-option">
            <input type="radio" name="q${index}" value="false" id="false-${index}" ${isOptionSelected(question, index, 'false') ? 'checked' : ''}>
            <span class="option-checkmark"></span>
            <span class="option-text">否</span>
        </label>
        `;
    }

    // 顯示題目和導航按鈕
    domElements.questionContainer.innerHTML = `
    <div class="question-text">${index + 1}. ${question.question}</div>
    <div class="options">${optionsHtml}</div>
    <div class="navigation-buttons">
        ${index > 0 ? '<button id="prev-btn" class="nav-btn">上一題</button>' : ''}
        <button id="next-btn" class="nav-btn">${index === systemState.currentQuiz.length - 1 ? '提交測驗' : '下一題'}</button>
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
            const trueFalseRadioTrue = document.querySelector(`input[name="q${index}"][value="true"]`);
            const trueFalseRadioFalse = document.querySelector(`input[name="q${index}"][value="false"]`);
            if (trueFalseRadioTrue && trueFalseRadioTrue.checked) {
                return 'true';
            } 
            if (trueFalseRadioFalse && trueFalseRadioFalse.checked) {
                return 'false';
            }
            return null; // 若無選擇
        default:
            return null;
    }
}

// 提交測驗
function submitQuiz() {
    const lastIndex = systemState.currentQuiz.length - 1;
    const lastQuestion = systemState.currentQuiz[lastIndex];
    saveAnswer(lastIndex, lastQuestion.type);
    
    const score = calculateScore();
    const results = generateResults();
    
    saveQuizHistory(score);
    
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
            explanation: question.reference || ''
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
            ${result.explanation ? `<p class="explanation">參考資料: ${result.explanation}</p>` : ''}
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
        domElements.historyList.innerHTML = '<p>暫無歷史紀錄</p>';
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
        btn.addEventListener('click', function () {
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
        <p>您的答案: <span class="${detail.isCorrect ? 'correct-answer' : 'wrong-answer'}">${Array.isArray(detail.userAnswer) ? detail.userAnswer.join(', ') : detail.userAnswer}</span></p>
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
    if (confirm('確定要刪除所有歷史紀錄嗎？此操作無法復原！')) {
        systemState.historyRecords = [];
        localStorage.removeItem('quizHistory');
        showHistory();
    }
}

// 初始化系統
initSystem();
