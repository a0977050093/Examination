let currentQuestions = [];

// 當選擇科目後載入對應的題庫
function loadSubject() {
  const subject = document.getElementById("subject").value;
  if (!subject) return;

  fetch(`${subject}.json`) // 根據選定科目載入對應的 JSON 文件
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load JSON: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      currentQuestions = data.questions; // 將題目儲存到變數
      renderQuiz(); // 呼叫函式渲染題目
    })
    .catch(error => {
      console.error("Error loading subject:", error);
      document.getElementById("quiz-container").innerHTML = "<p>無法載入題庫，請檢查檔案是否存在。</p>";
    });
}

// 渲染測驗題目
function renderQuiz() {
  const quizContainer = document.getElementById("quiz-container");
  quizContainer.innerHTML = "";

  currentQuestions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `<p>Q${index + 1}: ${q.question}</p>`;

    // 根據題目類型顯示不同的輸入元件
    if (q.type === "true_false") {
      questionDiv.innerHTML += `
        <label><input type="radio" name="q${index}" value="true"> O 正確</label>
        <label><input type="radio" name="q${index}" value="false"> X 錯誤</label>`;
    } else if (q.type === "single_choice") {
      q.options.forEach(option => {
        questionDiv.innerHTML += `
          <label><input type="radio" name="q${index}" value="${option}"> ${option}</label>`;
      });
    } else if (q.type === "multiple_choice") {
      q.options.forEach(option => {
        questionDiv.innerHTML += `
          <label><input type="checkbox" name="q${index}" value="${option}"> ${option}</label>`;
      });
    } else if (q.type === "short_answer") {
      questionDiv.innerHTML += `
        <textarea name="q${index}" rows="3" placeholder="請作答"></textarea>`;
    }

    quizContainer.appendChild(questionDiv);
  });
}

// 提交測驗並顯示結果
function submitQuiz() {
  let score = 0;
  let resultHTML = "";

  currentQuestions.forEach((q, index) => {
    const inputs = document.querySelectorAll(`[name="q${index}"]`);
    let userAnswer = null;

    if (q.type === "true_false" || q.type === "single_choice") {
      const selected = [...inputs].find(input => input.checked);
      userAnswer = selected ? selected.value : null;
      if (userAnswer === q.answer) score++;
    } else if (q.type === "multiple_choice") {
      const selected = [...inputs].filter(input => input.checked).map(input => input.value);
      userAnswer = selected.sort().toString();
      if (JSON.stringify(selected.sort()) === JSON.stringify(q.answer.sort())) score++;
    }

    // 顯示答案解析
    const isCorrect = userAnswer === q.answer ? "正確" : "錯誤";
    resultHTML += `
      <p>Q${index + 1}: ${q.question} (${isCorrect})</p>
      <p>你的答案：${userAnswer || "未作答"}</p>
      <p>正確答案：${q.answer}</p>
      <p>解析：${q.explanation || "無"}</p><hr>`;
  });

  resultHTML += `<p><strong>總得分：${score}/${currentQuestions.length}</strong></p>`;
  document.getElementById("result").innerHTML = resultHTML;
}
