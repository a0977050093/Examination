let currentQuestions = []; // 儲存當前題庫的題目

// 載入科目題庫
function loadSubject() {
  // 取得選擇的科目名稱
  const subject = document.getElementById("subject").value;
  
  // 若未選擇科目則不執行後續程式
  if (!subject) return;

  // 請求對應科目的題庫 JSON 檔案
  fetch(`${subject}.json`)
    .then(response => response.json()) // 將回應轉換為 JSON 格式
    .then(data => {
      // 顯示科目的題庫資料摘要（如題目數量及題型）
      displaySubjectInfo(data);

      // 依照用戶選擇的練習模式或測驗模式載入題目
      const mode = document.querySelector('input[name="mode"]:checked');
      if (mode && mode.value === 'practice') {
        loadPracticeMode(data); // 載入練習模式
      } else {
        loadTestMode(data); // 載入測驗模式
      }
    })
    .catch(error => {
      // 顯示錯誤訊息
      console.error("Error loading subject:", error);
      document.getElementById("quiz-container").innerHTML = "<p>無法載入題庫，請檢查檔案是否存在。</p>";
    });
}

// 顯示科目的題庫資料摘要（題目數量及題型）
function displaySubjectInfo(data) {
  const subjectInfo = document.getElementById("subject-info");
  // 計算題庫中單選題和複選題的數量
  const singleChoiceCount = data.questions.filter(q => q.type === "single_choice").length;
  const multipleChoiceCount = data.questions.filter(q => q.type === "multiple_choice").length;

  // 顯示科目的題庫信息
  subjectInfo.innerHTML = `
    <p>題庫包含：單選題：${singleChoiceCount} 題，複選題：${multipleChoiceCount} 題</p>
    <p>請選擇題型並開始練習或測驗。</p>
  `;
}

// 載入練習模式（顯示所有題目）
function loadPracticeMode(data) {
  currentQuestions = data.questions; // 取出所有題目
  renderQuiz(); // 渲染所有題目
}

// 載入測驗模式（隨機選擇 20 題單選題與 10 題複選題）
function loadTestMode(data) {
  const singleChoice = data.questions.filter(q => q.type === "single_choice");
  const multipleChoice = data.questions.filter(q => q.type === "multiple_choice");

  // 隨機選擇 20 題單選題，10 題複選題
  currentQuestions = [
    ...getRandomQuestions(singleChoice, 20),
    ...getRandomQuestions(multipleChoice, 10),
  ];

  renderQuiz(); // 渲染測驗題目
}

// 隨機選擇指定數量的題目
function getRandomQuestions(questions, count) {
  const shuffled = questions.sort(() => Math.random() - 0.5); // 亂數打亂題目順序
  return shuffled.slice(0, count); // 取前 count 顆題目
}

// 渲染測驗題目（以表格形式顯示）
function renderQuiz() {
  const quizContainer = document.getElementById("quiz-container");
  // 初始化表格結構
  quizContainer.innerHTML = `<table border="0" width="100%" cellpadding="5"><tbody></tbody></table>`;
  const tbody = quizContainer.querySelector("tbody");

  // 遍歷每道題目並生成對應的表格行
  currentQuestions.forEach((q, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td align="right" valign="top">${index + 1}.</td> <!-- 題號 -->
      <td>
        <div style="margin-bottom: 10px;">${q.question}</div> <!-- 顯示題目 -->
        <div>${renderOptions(q, index)}</div> <!-- 顯示選項 -->
      </td>`;
    tbody.appendChild(row);
  });
}

// 根據題目類型渲染選項
function renderOptions(question, index) {
  if (question.type === "single_choice") {
    // 單選題選項以 radio button 顯示
    return question.options
      .map(option => `<label><input type="radio" name="q${index}" value="${option}"> ${option}</label>`)
      .join("<br>");
  } else if (question.type === "multiple_choice") {
    // 複選題選項以 checkbox 顯示
    return question.options
      .map(option => `<label><input type="checkbox" name="q${index}" value="${option}"> ${option}</label>`)
      .join("<br>");
  }
  return ""; // 若題目類型未定義，返回空字串
}

// 提交測驗並顯示結果
function submitQuiz() {
  let score = 0; // 總得分
  let resultHTML = "<h3>測驗結果：</h3>";

  // 遍歷每道題目，檢查作答是否正確
  currentQuestions.forEach((q, index) => {
    const inputs = document.querySelectorAll(`[name="q${index}"]`);
    let userAnswer = null;

    if (q.type === "single_choice") {
      // 單選題取得被選中的值
      const selected = [...inputs].find(input => input.checked);
      userAnswer = selected ? selected.value : null;
      if (userAnswer === q.answer) score += 3; // 答對單選題加 3 分
    } else if (q.type === "multiple_choice") {
      // 複選題取得所有被選中的值
      const selected = [...inputs].filter(input => input.checked).map(input => input.value);
      userAnswer = selected.sort().toString();
      // 檢查答案是否正確
      if (JSON.stringify(selected.sort()) === JSON.stringify(q.answer.sort())) score += 4; // 答對複選題加 4 分
    }

    // 比較答案，顯示正確或錯誤
    const isCorrect = userAnswer === q.answer ? "✔ 正確" : "✘ 錯誤";
    resultHTML += `
      <p>Q${index + 1}: ${q.question} (${isCorrect})</p>
      <p>你的答案：${userAnswer || "未作答"}</p>
      <p>正確答案：${q.answer}</p>
      <hr>`;
  });

  // 顯示總分
  resultHTML += `<p><strong>總得分：${score}/100</strong></p>`;
  document.getElementById("result").innerHTML = resultHTML;
}
