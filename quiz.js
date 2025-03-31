let currentQuestions = []; // 儲存當前題庫的題目
let currentMode = ""; // 記錄當前模式
let currentSubject = ""; // 記錄當前科目

// 載入科目題庫
function loadSubject() {
  // 取得選擇的科目名稱
  currentSubject = document.getElementById("subject").value;

  // 若未選擇科目則不執行後續程式
  if (!currentSubject) return;

  // 請求對應科目的題庫 JSON 檔案
  fetchSubjectData(currentSubject)
    .then(data => {
      // 顯示科目的題庫資料摘要（如題目數量及題型）
      displaySubjectInfo(data);

      // 顯示模式選擇區塊
      document.getElementById("mode-selection").style.display = "block";
    })
    .catch(error => {
      // 顯示錯誤訊息
      console.error("Error loading subject:", error);
      document.getElementById("quiz-container").innerHTML =
        "<p>無法載入題庫，請檢查檔案是否存在。</p>";
    });
}

// 選擇模式（練習模式或測驗模式）
function selectMode(mode) {
  currentMode = mode;
  
  // 請求對應科目的題庫 JSON 檔案
  fetchSubjectData(currentSubject)
    .then(data => {
      if (mode === "practice") {
        loadPracticeMode(data); // 載入練習模式
      } else if (mode === "test") {
        loadTestMode(data); // 載入測驗模式
      }
    })
    .catch(error => {
      // 顯示錯誤訊息
      console.error("Error loading subject:", error);
      document.getElementById("quiz-container").innerHTML =
        "<p>無法載入題庫，請檢查檔案是否存在。</p>";
    });
}

// 提交測驗並顯示結果
function submitQuiz() {
  let score = 0; // 總得分
  let correctCount = 0; // 答對題數
  let totalQuestions = currentQuestions.length; // 總題數
  let resultHTML = "<h3>測驗結果：</h3>";
  let testDetails = []; // 儲存每題詳細結果

  // 遍歷每道題目，檢查作答是否正確
  currentQuestions.forEach((q, index) => {
    const inputs = document.querySelectorAll(`[name="q${index}"]`);
    let userAnswer = null;
    let isCorrect = false;

    if (q.type === "single_choice") {
      // 單選題取得被選中的值
      const selected = [...inputs].find(input => input.checked);
      userAnswer = selected ? selected.value : null;
      isCorrect = userAnswer === q.answer;
      if (isCorrect) {
        score += 3; // 答對單選題加 3 分
        correctCount++;
      }
    } else if (q.type === "multiple_choice") {
      // 複選題取得所有被選中的值
      const selected = [...inputs].filter(input => input.checked).map(input => input.value);
      userAnswer = selected.sort().toString();
      // 檢查答案是否正確
      isCorrect = JSON.stringify(selected.sort()) === JSON.stringify(q.answer.sort());
      if (isCorrect) {
        score += 4; // 答對複選題加 4 分
        correctCount++;
      }
    } else if (q.type === "true_false") {
      // 是非題取得被選中的值
      const selected = [...inputs].find(input => input.checked);
      userAnswer = selected ? selected.value === "true" : null;
      isCorrect = userAnswer === q.answer;
      if (isCorrect) {
        score += 2; // 答對是非題加 2 分
        correctCount++;
      }
    }

    // 儲存每題詳細結果
    testDetails.push({
      question: q.question,
      userAnswer: userAnswer || "未作答",
      correctAnswer: q.answer,
      isCorrect: isCorrect
    });

    // 比較答案，顯示正確或錯誤
    const resultText = isCorrect ? "✔ 正確" : "✘ 錯誤";
    resultHTML += `
      <p>Q${index + 1}: ${q.question} (${resultText})</p>
      <p>你的答案：${userAnswer || "未作答"}</p>
      <p>正確答案：${q.answer}</p>
      <hr>`;
  });

  // 顯示總分
  resultHTML += `<p><strong>總得分：${score}/100</strong></p>`;
  resultHTML += `<p>答對題數：${correctCount}/${totalQuestions}</p>`;
  
  // 如果是測驗模式，記錄成績
  if (currentMode === "test") {
    saveTestResult(score, correctCount, totalQuestions, testDetails);
    resultHTML += `<button class="btn" onclick="viewTestHistory()">查看歷史成績</button>`;
  }
  
  document.getElementById("result").innerHTML = resultHTML;
}

// 儲存測驗結果到 LocalStorage
function saveTestResult(score, correctCount, totalQuestions, testDetails) {
  // 從 LocalStorage 獲取現有的成績記錄
  let testHistory = JSON.parse(localStorage.getItem("testHistory")) || [];
  
  // 創建新的成績記錄
  const newRecord = {
    date: new Date().toLocaleString(),
    subject: currentSubject,
    score: score,
    correctCount: correctCount,
    totalQuestions: totalQuestions,
    details: testDetails
  };
  
  // 將新記錄添加到成績記錄中
  testHistory.push(newRecord);
  
  // 儲存回 LocalStorage
  localStorage.setItem("testHistory", JSON.stringify(testHistory));
}

// 查看歷史成績
function viewTestHistory() {
  // 從 LocalStorage 獲取成績記錄
  let testHistory = JSON.parse(localStorage.getItem("testHistory")) || [];
  
  // 只顯示當前科目的成績記錄
  const subjectHistory = testHistory.filter(record => record.subject === currentSubject);
  
  if (subjectHistory.length === 0) {
    document.getElementById("result").innerHTML = "<p>沒有找到歷史成績記錄。</p>";
    return;
  }
  
  let historyHTML = "<h3>歷史成績記錄 (" + currentSubject + ")</h3>";
  historyHTML += "<table border='1' cellpadding='5' style='width:100%; border-collapse:collapse;'>";
  historyHTML += "<tr><th>日期</th><th>分數</th><th>答對題數</th><th>總題數</th><th>詳細</th></tr>";
  
  subjectHistory.forEach((record, index) => {
    historyHTML += `
      <tr>
        <td>${record.date}</td>
        <td>${record.score}/100</td>
        <td>${record.correctCount}/${record.totalQuestions}</td>
        <td>${record.totalQuestions}</td>
        <td><button class="btn" onclick="showTestDetails(${index})">查看</button></td>
      </tr>`;
  });
  
  historyHTML += "</table>";
  document.getElementById("result").innerHTML = historyHTML;
}

// 顯示單次測驗的詳細結果
function showTestDetails(index) {
  // 從 LocalStorage 獲取成績記錄
  let testHistory = JSON.parse(localStorage.getItem("testHistory")) || [];
  
  // 只篩選當前科目的成績記錄
  const subjectHistory = testHistory.filter(record => record.subject === currentSubject);
  
  if (index < 0 || index >= subjectHistory.length) {
    document.getElementById("result").innerHTML = "<p>無效的成績記錄索引。</p>";
    return;
  }
  
  const record = subjectHistory[index];
  let detailsHTML = `<h3>測驗詳細結果 (${record.date})</h3>`;
  detailsHTML += `<p>科目: ${record.subject}</p>`;
  detailsHTML += `<p>總得分: ${record.score}/100</p>`;
  detailsHTML += `<p>答對題數: ${record.correctCount}/${record.totalQuestions}</p>`;
  detailsHTML += "<hr><h4>各題詳細結果:</h4>";
  
  record.details.forEach((detail, qIndex) => {
    const resultText = detail.isCorrect ? "✔ 正確" : "✘ 錯誤";
    detailsHTML += `
      <p>Q${qIndex + 1}: ${detail.question} (${resultText})</p>
      <p>你的答案：${detail.userAnswer}</p>
      <p>正確答案：${detail.correctAnswer}</p>
      <hr>`;
  });
  
  detailsHTML += `<button class="btn" onclick="viewTestHistory()">返回成績列表</button>`;
  document.getElementById("result").innerHTML = detailsHTML;
}
