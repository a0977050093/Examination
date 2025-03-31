// 全局變量
let currentQuestions = [];
let currentMode = "";
let currentSubject = "";
let testHistory = JSON.parse(localStorage.getItem("testHistory")) || [];

// DOM載入完成後執行
document.addEventListener("DOMContentLoaded", function() {
  // 初始化顯示密碼彈窗
  document.getElementById('passwordModal').style.display = 'flex';
  document.getElementById('mainContent').style.display = 'none';
  
  // 添加Enter鍵支持
  document.getElementById('passwordInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
});

// 密碼驗證
function checkPassword() {
  const password = document.getElementById('passwordInput').value.trim();
  const errorElement = document.getElementById('passwordError');
  
  if (!password) {
    errorElement.textContent = '請輸入密碼';
    return;
  }
  
  if (password === '22143') {
    // 密碼正確，顯示主內容
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    // 清空密碼輸入
    document.getElementById('passwordInput').value = '';
  } else {
    // 密碼錯誤
    errorElement.textContent = '密碼錯誤，請重新輸入';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
}

// 顯示載入狀態
function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

// 隱藏載入狀態
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

// 載入科目數據
async function loadSubject() {
  currentSubject = document.getElementById("subject").value;
  if (!currentSubject) {
    alert("請選擇科目");
    return;
  }

  showLoading();
  try {
    const data = await fetchSubjectData(currentSubject);
    displaySubjectInfo(data);
    document.getElementById("mode-selection").style.display = "block";
    document.getElementById("subject-info").style.display = "block";
  } catch (error) {
    console.error("載入失敗:", error);
    document.getElementById("quiz-container").innerHTML = 
      "<p class='error'>載入題庫失敗，請稍後再試。</p>";
  } finally {
    hideLoading();
  }
}

// 獲取科目數據
async function fetchSubjectData(subject) {
  const response = await fetch(`data/${subject}.json`);
  if (!response.ok) throw new Error("網路請求失敗");
  
  const data = await response.json();
  if (!data.questions || !Array.isArray(data.questions)) {
    throw new Error("題庫格式錯誤");
  }
  return data;
}

// 顯示科目信息
function displaySubjectInfo(data) {
  const subjectInfo = document.getElementById("subject-info");
  
  const singleChoiceCount = data.questions.filter(q => q.type === "single_choice").length;
  const multipleChoiceCount = data.questions.filter(q => q.type === "multiple_choice").length;
  const trueFalseCount = data.questions.filter(q => q.type === "true_false").length;

  subjectInfo.innerHTML = `
    <h3>題庫資訊</h3>
    <p>當前科目：${document.getElementById("subject").options[document.getElementById("subject").selectedIndex].text}</p>
    <ul class="question-stats">
      <li>總題數：${data.questions.length} 題</li>
      <li>單選題：${singleChoiceCount} 題</li>
      <li>複選題：${multipleChoiceCount} 題</li>
      <li>是非題：${trueFalseCount} 題</li>
    </ul>
  `;
}

// 選擇模式
function selectMode(mode) {
  currentMode = mode;
  if (mode === "practice") {
    document.getElementById("customize-practice").style.display = "block";
    document.getElementById("quiz-container").innerHTML = "";
    document.getElementById("result").innerHTML = "";
  } else if (mode === "test") {
    startTestMode();
  }
}

// 開始測驗模式
async function startTestMode() {
  showLoading();
  try {
    const data = await fetchSubjectData(currentSubject);
    const singleChoice = data.questions.filter(q => q.type === "single_choice");
    const multipleChoice = data.questions.filter(q => q.type === "multiple_choice");
    const trueFalse = data.questions.filter(q => q.type === "true_false");

    currentQuestions = [
      ...getRandomQuestions(singleChoice, 20),
      ...getRandomQuestions(multipleChoice, 10),
      ...getRandomQuestions(trueFalse, 10)
    ];
    
    renderQuiz();
  } catch (error) {
    console.error("測驗模式錯誤:", error);
    document.getElementById("quiz-container").innerHTML = 
      "<p class='error'>初始化測驗失敗，請重試。</p>";
  } finally {
    hideLoading();
  }
}

// 隨機選擇題目
function getRandomQuestions(questions, count) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 渲染題目
function renderQuiz() {
  const quizContainer = document.getElementById("quiz-container");
  quizContainer.innerHTML = `
    <h3>測驗題目 (共 ${currentQuestions.length} 題)</h3>
    <div class="quiz-questions">
      <table><tbody></tbody></table>
    </div>
  `;
  
  const tbody = quizContainer.querySelector("tbody");
  currentQuestions.forEach((q, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td width="40">${index + 1}.</td>
      <td>
        <div class="question-text">${q.question}</div>
        <div class="options">${renderOptions(q, index)}</div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 渲染選項
function renderOptions(question, index) {
  if (question.type === "single_choice" || question.type === "multiple_choice") {
    return question.options.map(option => `
      <label class="option">
        <input type="${question.type === 'single_choice' ? 'radio' : 'checkbox'}" 
               name="q${index}" value="${option}">
        ${option}
      </label><br>
    `).join("");
  } else if (question.type === "true_false") {
    return `
      <label class="option"><input type="radio" name="q${index}" value="true"> 是</label><br>
      <label class="option"><input type="radio" name="q${index}" value="false"> 否</label>
    `;
  }
  return "";
}

// 提交測驗
function submitQuiz() {
  let score = 0;
  let correctCount = 0;
  let resultHTML = "<h3>測驗結果</h3>";
  const testDetails = [];

  currentQuestions.forEach((q, index) => {
    const inputs = document.querySelectorAll(`[name="q${index}"]`);
    let userAnswer = null;
    let isCorrect = false;

    if (q.type === "single_choice") {
      const selected = [...inputs].find(input => input.checked);
      userAnswer = selected ? selected.value : null;
      isCorrect = userAnswer === q.answer;
      if (isCorrect) {
        score += 3;
        correctCount++;
      }
    } 
    else if (q.type === "multiple_choice") {
      const selected = [...inputs].filter(input => input.checked).map(input => input.value);
      userAnswer = selected.sort().join(", ");
      isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(q.answer.sort());
      if (isCorrect) {
        score += 4;
        correctCount++;
      }
    }
    else if (q.type === "true_false") {
      const selected = [...inputs].find(input => input.checked);
      userAnswer = selected ? selected.value === "true" : null;
      isCorrect = userAnswer === q.answer;
      if (isCorrect) {
        score += 2;
        correctCount++;
      }
    }

    testDetails.push({
      question: q.question,
      userAnswer: userAnswer || "未作答",
      correctAnswer: Array.isArray(q.answer) ? q.answer.join(", ") : q.answer,
      isCorrect: isCorrect
    });

    resultHTML += `
      <div class="question-result ${isCorrect ? 'correct' : 'incorrect'}">
        <p><strong>第 ${index + 1} 題</strong>: ${q.question}</p>
        <p>你的答案: ${userAnswer || "未作答"}</p>
        <p>正確答案: ${Array.isArray(q.answer) ? q.answer.join(", ") : q.answer}</p>
        <p class="result-feedback">${isCorrect ? '✓ 答對了！' : '✗ 答錯了'}</p>
      </div>
      <hr>
    `;
  });

  // 記錄測驗結果
  if (currentMode === "test") {
    const testRecord = {
      date: new Date().toLocaleString('zh-TW'),
      subject: currentSubject,
      score: score,
      correctCount: correctCount,
      totalQuestions: currentQuestions.length,
      details: testDetails
    };
    
    testHistory.push(testRecord);
    localStorage.setItem("testHistory", JSON.stringify(testHistory));
    
    resultHTML += `
      <div class="test-summary">
        <h4>測驗統計</h4>
        <p>總分: <strong>${score}/100</strong></p>
        <p>答對題數: <strong>${correctCount}/${currentQuestions.length}</strong></p>
        <p>正確率: <strong>${Math.round((correctCount/currentQuestions.length)*100)}%</strong></p>
      </div>
      <button class="btn primary" onclick="viewTestHistory()">查看歷史成績</button>
    `;
  }

  document.getElementById("result").innerHTML = resultHTML;
}

// 查看歷史成績
function viewTestHistory() {
  const subjectHistory = testHistory.filter(record => record.subject === currentSubject);
  
  if (subjectHistory.length === 0) {
    document.getElementById("result").innerHTML = "<p>沒有歷史成績記錄。</p>";
    return;
  }

  let historyHTML = `
    <h3>歷史成績 (${document.getElementById("subject").options[document.getElementById("subject").selectedIndex].text})</h3>
    <div class="history-table">
      <table>
        <thead>
          <tr>
            <th>測驗日期</th>
            <th>分數</th>
            <th>答對題數</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
  `;

  subjectHistory.forEach((record, index) => {
    historyHTML += `
      <tr>
        <td>${record.date}</td>
        <td>${record.score}/100</td>
        <td>${record.correctCount}/${record.totalQuestions}</td>
        <td><button class="btn secondary" onclick="showTestDetails(${index})">查看詳情</button></td>
      </tr>
    `;
  });

  historyHTML += `
        </tbody>
      </table>
    </div>
    <button class="btn primary" onclick="backToQuiz()">返回測驗</button>
  `;

  document.getElementById("result").innerHTML = historyHTML;
}

// 顯示測驗詳情
function showTestDetails(index) {
  const record = testHistory[index];
  let detailsHTML = `
    <h3>測驗詳細結果 (${record.date})</h3>
    <div class="test-meta">
      <p><strong>科目:</strong> ${record.subject}</p>
      <p><strong>總分:</strong> ${record.score}/100</p>
      <p><strong>答對題數:</strong> ${record.correctCount}/${record.totalQuestions}</p>
    </div>
    <div class="test-details">
      <h4>各題結果:</h4>
  `;

  record.details.forEach((detail, qIndex) => {
    detailsHTML += `
      <div class="question-detail ${detail.isCorrect ? 'correct' : 'incorrect'}">
        <p><strong>第 ${qIndex + 1} 題</strong>: ${detail.question}</p>
        <p>你的答案: ${detail.userAnswer}</p>
        <p>正確答案: ${detail.correctAnswer}</p>
        <p class="result-feedback">${detail.isCorrect ? '✓ 答對了' : '✗ 答錯了'}</p>
      </div>
      <hr>
    `;
  });

  detailsHTML += `
    </div>
    <button class="btn primary" onclick="viewTestHistory()">返回歷史記錄</button>
  `;

  document.getElementById("result").innerHTML = detailsHTML;
}

// 返回測驗
function backToQuiz() {
  document.getElementById("result").innerHTML = "";
}
