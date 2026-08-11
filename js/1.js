
// ========================================
// 之前的练习代码（保留作为参考）
// ========================================
// //判断
// var number = 1
// if (number == 1)
// {
//     console.log("114514")
// }
// //循环
// for (var i = 1;i<=10;i++)
// {
//     console.log(i)
// }
// var i = 0
// while(i<10)
// {
//     console.log(i)
//     i++
// }
// //substring方法,前闭后开
// console.log('114514'.substring(1,3))
// //自定义函数：function
// function print(s)
// {
//     console.log(s)
// }
// print(114514)
// function add(a,b)
// {
//     return a+b
// }
// print(add(1,2))
// //DOM操作
// var div1 = document.getElementsByTagName("div")[0]
// div1.innerHTML = "helloworld"

// ========================================
// 网页交互示例
// ========================================

// ---------- 示例1：计数器 ----------

// 1. 获取页面元素（通过id获取）
var countSpan = document.getElementById("count");
var btnPlus = document.getElementById("btn-plus");
var btnMinus = document.getElementById("btn-minus");

// 2. 定义一个变量来存储计数值
var count = 0;

// 3. 给"+"按钮绑定点击事件
btnPlus.onclick = function() {
    count = count + 1;          // 计数值+1
    countSpan.innerHTML = count; // 更新页面显示
    console.log("当前计数：" + count); // 在控制台打印（按F12查看）
};

// 4. 给"-"按钮绑定点击事件
btnMinus.onclick = function() {
    count = count - 1;          // 计数值-1
    countSpan.innerHTML = count; // 更新页面显示
    console.log("当前计数：" + count);
};


// ---------- 示例2：问候功能 ----------

var nameInput = document.getElementById("name-input");
var btnGreet = document.getElementById("btn-greet");
var greetMessage = document.getElementById("greet-message");

btnGreet.onclick = function() {
    // 获取输入框中的值
    var name = nameInput.value;

    // 判断：如果没输入名字，给出提示
    if (name === "") {
        greetMessage.innerHTML = "请输入你的名字哦~";
        greetMessage.style.color = "red";
    } else {
        greetMessage.innerHTML = "你好，" + name + "！欢迎学习JavaScript！";
        greetMessage.style.color = "green";
    }
};