let currentQuestions = [];

// 載入科目題庫
function loadSubject() {
  const subject = document.getElementById("subject").value;
  if (!subject) return;

  fetch(`${subject}.json`)
    .then(response => response.json())
    .then(data => {
      // 將單選與複選題分開處理
      const singleChoice = data.questions.filter(q => q.type === "single_choice");
      const multipleChoice = data.questions.filter(q => q.type === "multiple_choice");

      // 隨機選擇單選 20 題，複選 10 題
      currentQuestions = [
        ...getRandomQuestions(singleChoice, 20),
        ...getRandomQuestions(multipleChoice, 10),
      ];
      renderQuiz();
    })
    .catch(error => {
      console.error("Error loading subject:", error);
      document.getElementById("quiz-container").innerHTML = "<p>無法載入題庫，請檢查檔案是否存在。</p>";
    });
}

// 隨機選擇指定數量的題目
function getRandomQuestions(questions, count) {
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 渲染測驗題目（以表格形式顯示）
function renderQuiz() {
  const quizContainer = document.getElementById("quiz-container");
  quizContainer.innerHTML = `<table border="0" width="100%" cellpadding="5"><tbody></tbody></table>`;
  const tbody = quizContainer.querySelector("tbody");

  currentQuestions.forEach((q, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td align="right" valign="top">${index + 1}.</td>
      <td>${q.question}</td>
      <td>${renderOptions(q, index)}</td>`;
    tbody.appendChild(row);
  });
}

// 根據題目類型渲染選項
function renderOptions(question, index) {
  if (question.type === "single_choice") {
    return question.options
      .map(option => `<label><input type="radio" name="q${index}" value="${option}"> ${option}</label>`)
      .join("<br>");
  } else if (question.type === "multiple_choice") {
    return question.options
      .map(option => `<label><input type="checkbox" name="q${index}" value="${option}"> ${option}</label>`)
      .join("<br>");
  }
  return "";
}

// 提交測驗並顯示結果
function submitQuiz() {
  let score = 0;
  let resultHTML = "<h3>測驗結果：</h3>";

  currentQuestions.forEach((q, index) => {
    const inputs = document.querySelectorAll(`[name="q${index}"]`);
    let userAnswer = null;

    if (q.type === "single_choice") {
      const selected = [...inputs].find(input => input.checked);
      userAnswer = selected ? selected.value : null;
      if (userAnswer === q.answer) score += 3; // 單選每題 3 分
    } else if (q.type === "multiple_choice") {
      const selected = [...inputs].filter(input => input.checked).map(input => input.value);
      userAnswer = selected.sort().toString();
      if (JSON.stringify(selected.sort()) === JSON.stringify(q.answer.sort())) score += 4; // 複選每題 4 分
    }

    // 比較答案，標示錯誤
    const isCorrect = userAnswer === q.answer ? "✔ 正確" : "✘ 錯誤";
    resultHTML += `
      <p>Q${index + 1}: ${q.question} (${isCorrect})</p>
      <p>你的答案：${userAnswer || "未作答"}</p>
      <p>正確答案：${q.answer}</p>
      <hr>`;
  });

  resultHTML += `<p><strong>總得分：${score}/100</strong></p>`;
  document.getElementById("result").innerHTML = resultHTML;
}
