// 題庫資料從 JSON 檔案載入
let currentQuestions = [];

// 根據選擇的科目載入題庫
function loadSubject() {
  const subject = document.getElementById("subject").value;
  if (!subject) return;

  fetch(`${subject}.json`)
    .then(response => response.json())
    .then(data => {
      currentQuestions = data.questions;
      renderQuiz();
    })
    .catch(error => console.error("Error loading subject:", error));
}

// 渲染題目
function renderQuiz() {
  const quizContainer = document.getElementById("quiz-container");
  quizContainer.innerHTML = "";

  currentQuestions.forEach((q, index) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `<p>Q${index + 1}: ${q.question}</p>`;

    if (q.type === "true_false") {
      // 是非題 OX 核選框
      questionDiv.innerHTML += `
        <div class="options">
          <label><input type="radio" name="q${index}" value="true"> O (正確)</label>
          <label><input type="radio" name="q${index}" value="false"> X (錯誤)</label>
        </div>`;
    } else if (q.type === "single_choice") {
      // 單選題
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      questionDiv.innerHTML += `<div class="options">`;
      shuffledOptions.forEach(opt => {
        questionDiv.innerHTML += `
          <label><input type="radio" name="q${index}" value="${opt}"> ${opt}</label>`;
      });
      questionDiv.innerHTML += `</div>`;
    } else if (q.type === "multiple_choice") {
      // 複選題
      const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
      questionDiv.innerHTML += `<div class="options">`;
      shuffledOptions.forEach(opt => {
        questionDiv.innerHTML += `
          <label><input type="checkbox" name="q${index}" value="${opt}"> ${opt}</label>`;
      });
      questionDiv.innerHTML += `</div>`;
    } else if (q.type === "short_answer") {
      // 問答題
      questionDiv.innerHTML += `
        <textarea name="q${index}" rows="3" cols="40" placeholder="請作答"></textarea>`;
    }

    quizContainer.appendChild(questionDiv);
  });
}

// 提交測驗
function submitQuiz() {
  const userAnswers = [];
  currentQuestions.forEach((q, index) => {
    const inputs = document.querySelectorAll(`[name="q${index}"]`);
    if (q.type === "true_false" || q.type === "single_choice") {
      const selected = [...inputs].find(input => input.checked);
      userAnswers.push(selected ? selected.value : null);
    } else if (q.type === "multiple_choice") {
      userAnswers.push([...inputs].filter(input => input.checked).map(input => input.value));
    } else if (q.type === "short_answer") {
      userAnswers.push(inputs[0].value.trim());
    }
  });

  // 計算分數
  let score = 0;
  currentQuestions.forEach((q, index) => {
    if (q.type === "short_answer") return; // 問答題不計分
    if (Array.isArray(q.answer)) {
      if (JSON.stringify(q.answer.sort()) === JSON.stringify(userAnswers[index].sort())) {
        score++;
      }
    } else {
      if (q.answer === userAnswers[index]) {
        score++;
      }
    }
  });

  document.getElementById("result").innerText = `你的得分是：${
