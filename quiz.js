// 全局变量
let currentQuestions = [];
let currentMode = "";
let currentSubject = "";

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 绑定事件监听器
  document.getElementById('loadSubjectBtn').addEventListener('click', loadSubject);
  document.getElementById('practiceModeBtn').addEventListener('click', () => selectMode('practice'));
  document.getElementById('testModeBtn').addEventListener('click', () => selectMode('test'));
  document.getElementById('startPracticeBtn').addEventListener('click', startCustomPractice);
  document.getElementById('submitQuizBtn').addEventListener('click', submitQuiz);
});

// 加载科目
function loadSubject() {
  currentSubject = document.getElementById("subject").value;
  if (!currentSubject) {
    alert("請選擇科目");
    return;
  }

  // 模拟加载数据 - 实际使用时替换为真实数据加载
  const mockData = {
    questions: [
      // 示例题目数据
      {
        type: "single_choice",
        question: "示例單選題",
        options: ["選項1", "選項2", "選項3"],
        answer: "選項2"
      }
    ]
  };
  
  displaySubjectInfo(mockData);
  document.getElementById("mode-selection").style.display = "block";
}

// 显示科目信息
function displaySubjectInfo(data) {
  const subjectInfo = document.getElementById("subject-info");
  subjectInfo.innerHTML = `
    <h3>題庫資訊</h3>
    <p>當前科目：${document.getElementById("subject").options[document.getElementById("subject").selectedIndex].text}</p>
    <p>總題數：${data.questions.length}題</p>
  `;
  subjectInfo.style.display = "block";
}

// 选择模式
function selectMode(mode) {
  currentMode = mode;
  if (mode === "practice") {
    document.getElementById("customize-practice").style.display = "block";
  } else {
    // 初始化测验模式
    startTestMode();
  }
}

// 开始自定义练习
function startCustomPractice() {
  alert("練習模式開始 - 實際功能需接入真實題庫");
  // 这里添加实际练习模式逻辑
}

// 开始测验模式
function startTestMode() {
  alert("測驗模式開始 - 實際功能需接入真實題庫");
  // 这里添加实际测验模式逻辑
}

// 提交测验
function submitQuiz() {
  alert("測驗已提交 - 實際功能需接入真實評分系統");
  // 这里添加实际评分逻辑
}
