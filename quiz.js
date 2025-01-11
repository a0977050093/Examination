let currentQuestions = [];

// 科目選擇後載入題庫
function loadSubject() {
  const subject = document.getElementById("subject").value;
  if (!subject) return;

  fetch(`${subject}.json`) // 根據科目載入 JSON
    .then(response => response.json())
    .then(data => {
      currentQuestions = data.questions;
      renderQuiz(); // 渲染測驗題目
    })
    .catch(error => console.error("Error loading subject:", error));
}

// 渲染測驗題目
function renderQuiz() {
  const quizContainer = document.getElementById("quiz-container");
  quizContainer.innerHTML = "";

  currentQuestions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `<p>Q${index + 1}: ${q.question}</p>`;

    // 顯示不同類型的題目
    if (q.type === "true_false") {
      questionDiv.innerHTML += `
        <label><input type="radio" name="q${index}" value="true"> 正確</label>
        <label><input type="radio" name="q${index}" value="false"> 錯誤</label>`;
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

// 提交測驗
function submitQuiz() {
  let score = 0;

  currentQuestions.forEach((q, index) => {
    const inputs = document.querySelectorAll(`[name="q${index}"]`);
    if (q.type === "true_false" || q.type === "single_choice") {
      const selected = [...inputs].find(input => input.checked);
      if (selected && selected.value === q.answer) score++;
    } else if (q.type === "multiple_choice") {
      const selected = [...inputs].filter(input => input.checked).map(input => input.value);
      if (JSON.stringify(selected.sort()) === JSON.stringify(q.answer.sort())) score++;
    }
  });

  document.getElementById("result").innerText = `得分：${score}/${currentQuestions.length}`;
}
