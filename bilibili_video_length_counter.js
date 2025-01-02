// ==UserScript==
// @name         B站/哔哩哔哩时长统计
// @namespace    https://github.com/Ningest/Bilibili-Video-Length-Counter
// @version      1.0.0
// @description  当观看的视频选集有多个时，可以方便统计多个视频的总时长。
// @author       ningest
// @match        https://www.bilibili.com/video/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...




    var itemList = [];//存入对象->index索引,title课程标题,duration课程时长,scroller是否为当前播放状态
var inject = false;//注入html片段状态
var displayPopupState = false;//弹出层显示状态;
const htmlString = `
	<div id="ningest_jessie1314" style="display: none; z-index: 2147483647; width: 100%;height: 100%;position: fixed;top: 0px;left: 0px; background-color: rgba(0, 0, 0, 0.2)">
	    <div style="background-color: #fff; width: 600px; height: 100%; margin: 0 auto;padding: 5px; box-sizing: border-box;">
	        <div style="margin-bottom: 20px;width: 100%; text-align: center;">
	            <span id="mode_str" style="margin-right: 10px;color: #666;">未计算</span>
	            <span style="margin-right: 10px;color: #666;">总时长</span>
	            <span style="color: #666;">=</span>
	            <span id="hms_str" style="margin-right: 10px;margin-left: 10px;color: #007BFF;">格式1</span>
	            <span style="color: #666;">=</span>
	            <span id="ms_str" style="margin-right: 10px;margin-left: 10px;color: #28A745;">格式2</span>
	            <span style="color: #666;">=</span>
	            <span id="s_str" style="margin-left: 10px;color: #FFA500;">格式3</span>
	        </div>
	        <div style="display: flex; width: 100%;">
	            <button id="c_all_btn" style="flex-grow: 1; flex-basis: 0;" onclick="count_all()">计算全部</button>
	            <button id="c_before_btn" style="flex-grow: 1; flex-basis: 0;" onclick="count_before()">计算之前</button>
	            <button id="c_later_btn" style="flex-grow: 1; flex-basis: 0;" onclick="count_later()">计算之后</button>
	            <button id="c_select_btn" style="flex-grow: 1; flex-basis: 0;" onclick="count_select()">计算选中</button>
	        </div>
	        <div style="display: flex; width: 100%; margin-top: 10px;">
	            <button style="flex: 1; padding: 0 5px;" onclick="select_all()">选中全部</button>
	            <button style="flex: 1; padding: 0 5px;" onclick="empty_select()">清除选中</button>
	            <button style="flex: 1; padding: 0 5px;" onclick="set_scope()">选中设置范围</button>
	            <div style="flex: 1; display: flex; justify-content: center; align-items: center; padding: 0 5px;">
	                <input id="min_num" type="number" style="width: 50%;text-align: center;" value="0"/>
	                -
	                <input id="max_num" type="number" style="width: 50%;text-align: center;" value="0"/>
	            </div>
	        </div>
	        <div style="width: 100%;height: calc(100% - 120px); margin-top: 20px;overflow-y: auto;">
	            <table style="width: 100%; text-align: center; border-collapse: collapse; border: 1px solid #000;">
	                <thead>
	                    <tr>
	                        <th style="border: 1px solid #000; width: 40px;">选中</th>
	                        <th style="border: 1px solid #000; width: 40px;">序号</th>
	                        <th style="border: 1px solid #000;">标题</th>
	                        <th style="border: 1px solid #000; width: 100px;">时长</th>
	                    </tr>
	                </thead>
	                <tbody id="table_list">
	                </tbody>
	            </table>
	        </div>
	    </div>
	</div>`;
window.onload=function(){
	init();
}

//初始化
function init(){
	document.addEventListener('keydown', function(event) {
	    // 检查 Ctrl, Alt 和 N 键是否都被按下
	    if (event.ctrlKey && event.altKey && event.key === 'n' || event.code === 'KeyN') {
	        event.preventDefault();
			displayPopupState = !displayPopupState;
			displayPopup(displayPopupState);
	    }
	});
	console.log('按下【Ctrl + Alt + N】开启/关闭统计面板');
}


//是否显示弹出层
function displayPopup(state){
	if(!inject){
		document.body.insertAdjacentHTML('beforeend', htmlString);
		inject = true;
	}
	const ningest_jessie1314 = document.getElementById("ningest_jessie1314");
	if(state){
		ningest_jessie1314.style.display = 'block'
		parseVideoPodItems();
	}else{
		ningest_jessie1314.style.display = 'none'
        homing();
	}
}


// 创建并插入新行到tbody中
function addTableRow(checkboxValueAndSecondTdText, thirdTdText, fourthTdText ,scrolled) {
    // 创建新的表格行
    var newRow = document.createElement('tr');
    newRow.className = 'table_item_tr';
    // 创建包含复选框的第一个单元格
    var checkboxCell = document.createElement('td');
    checkboxCell.style.border = '1px solid #000';
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'table_item_cbox';
    checkbox.value = checkboxValueAndSecondTdText; // 设置复选框的值
    checkboxCell.appendChild(checkbox);
    // 创建第二个单元格，使用第一个参数作为文本内容
    var secondCell = document.createElement('td');
    secondCell.style.border = '1px solid #000';
    secondCell.textContent = checkboxValueAndSecondTdText;
    // 创建第三个和第四个单元格，分别使用第二、三个参数作为文本内容
    var thirdCell = document.createElement('td');
    thirdCell.style.border = '1px solid #000';
    thirdCell.textContent = thirdTdText;
    var fourthCell = document.createElement('td');
    fourthCell.style.border = '1px solid #000';
    fourthCell.textContent = fourthTdText;
    // 将所有单元格添加到新行中
    newRow.appendChild(checkboxCell);
    newRow.appendChild(secondCell);
    newRow.appendChild(thirdCell);
    newRow.appendChild(fourthCell);
    // 获取目标tbody元素并将新行添加进去
    var tableBody = document.getElementById('table_list');
    tableBody.appendChild(newRow);
}


//计算当前播放之前
function count_before(){
	homing();
	if(itemList.length<=0){
		alert("该页面没解析到课程列表!")
		return;
	}
	let durations = [];
	for(let i=0; i<itemList.length; i++){
		let item = itemList[i];
		if(item.scroller){
			break;
		}
		durations.push(item.duration);
	}
	calculateTotalDuration(durations,"计算之前模式");
}

//计算当前播放之后
function count_later(){
	homing();
	if(itemList.length<=0){
		alert("该页面没解析到课程列表!")
		return;
	}
	let durations = [];
	let state = false;
	for(let i=0; i<itemList.length; i++){
		let item = itemList[i];
		if(state){
			durations.push(item.duration);
		}
		if(item.scroller){
			state = true;
		}
	}
	calculateTotalDuration(durations,"计算之后模式");
}

//计算全部
function count_all(){
	homing();
	if(itemList.length<=0){
		alert("该页面没解析到课程列表!")
		return;
	}
	let durations = [];
	itemList.forEach(function(item){
		durations.push(item.duration);
	})
	calculateTotalDuration(durations,"计算全部模式");
}

//计算选中item
function count_select(){
	homing();
	let durations = [];
	let indexs = getSelect();
	if(indexs.length <= 0){
		alert("未选择任何数据!")
		return;
	}
	for(let a=0; a<itemList.length; a++){
		for(let i=0; i<indexs.length; i++){
			if(itemList[a].index == indexs[i]){
				durations.push(itemList[a].duration);
				indexs.splice(i,1);
				break
			}
		}
		if(indexs.length == 0){
			break;
		}
	}
	calculateTotalDuration(durations,"计算选中模式");
}

//获取选中索引数组【索引号】
function getSelect(){
	// 创建一个空数组来保存选中的复选框的值
	let selectedValues = [];
	// 获取所有具有特定类名和类型的输入元素
	let checkboxes = document.querySelectorAll('input.table_item_cbox[type="checkbox"]');
	// 遍历这些复选框
	checkboxes.forEach(function(checkbox) {
	    if (checkbox.checked) { // 检查是否被选中
	        selectedValues.push(checkbox.value); // 将选中的值添加到数组中
	    }
	});
	return selectedValues;
}

//根据数组【索引号】设置选中item
function setSelect(array){
	// 获取所有具有特定类名和类型的输入元素
	let checkboxes = document.querySelectorAll('input.table_item_cbox[type="checkbox"]');
	// 遍历这些复选框
	for(let a=0; a<checkboxes.length; a++){
		let item = checkboxes[a];
		for(let i = 0; i < array.length; i++){
			if(item.value == array[i]){
				item.checked = true;
				array.splice(i,1);
				break;
			}
		}
		if(array.length == 0){
			break;
		}
	}
}

//解析课程列表信息并存入itemList数组中
function parseVideoPodItems() {
	var tableBody = document.getElementById('table_list');
	tableBody.innerHTML = "";
	itemList = [];
    // 获取所有.video-pod__item元素
    const items = document.querySelectorAll('.video-pod__item');
    // 遍历每一个.video-pod__item元素
    items.forEach((item, index) => {
        // 从当前元素中提取所需的信息
        let title = item.querySelector('.title').getAttribute('title'); // 或者 .querySelector('.title-txt').textContent;
        let duration = item.querySelector('.stat-item.duration').textContent.trim();
        let scroller = item.getAttribute('data-scrolled') || false; // 如果没有设置data-scrolled属性，默认值为false
        // 将信息构造成对象并加入数组
        itemList.push({
            index: index,
            title: title,
            duration: duration,
            scroller: scroller === 'true'
        });
    });
	//解析到table中
	itemList.forEach(function(item){
		addTableRow(item.index,item.title,item.duration,item.scroller);
	})
}
//计算数组【时长】中时长的总和,并设置mode为显示的模式文本=计算全部模式，计算之前模式，计算之后模式，计算选中模式，
function calculateTotalDuration(durations,mode) {
		// 初始化总秒数
	    let totalSeconds = 0;
	    // 遍历数组中的每个时长并转换为秒数后相加
	    durations.forEach(duration => {
	        const [minutes, seconds] = duration.split(':').map(Number);
	        totalSeconds += minutes * 60 + seconds;
	    });
	    // 计算小时、分钟和秒
	    const hours = Math.floor(totalSeconds / 3600);
	    const minutes = Math.floor(totalSeconds / 60); // 总分钟数
	    const seconds = totalSeconds % 60; // 剩余秒数
		const remainingSecondsAfterHours = totalSeconds % 3600;
		const minutes2 = Math.floor(remainingSecondsAfterHours / 60);
	    // 格式化输出
	    function padZero(num) {
	        return num.toString().padStart(2, '0');
	    }
	    // 第一种格式：HH:MM:SS
	    const formatHMS = `${padZero(hours)}时${padZero(minutes2)}分${padZero(seconds)}秒`;
	    // 第二种格式：总分钟数和秒数
	    const totalMinutes = Math.floor(totalSeconds / 60);
	    const formatMS = `${totalMinutes}分${padZero(seconds)}秒`;
	    // 第三种格式：总秒数
	    const formatS = totalSeconds+"秒";
		document.getElementById('mode_str').textContent = mode;
		document.getElementById('hms_str').textContent = formatHMS;
		document.getElementById('ms_str').textContent = formatMS;
		document.getElementById('s_str').textContent = formatS;
}
//总时长归零
function homing(){
	document.getElementById('mode_str').textContent = "未计算";
	document.getElementById('hms_str').textContent = "格式1";
	document.getElementById('ms_str').textContent = "格式2";
	document.getElementById('s_str').textContent = "格式3";
}
//选中全部
function select_all(){
	let checkboxes = document.querySelectorAll('input.table_item_cbox[type="checkbox"]');
	checkboxes.forEach(function(item){
		item.checked = true;
	})
}
//清空选中
function empty_select(){
	let checkboxes = document.querySelectorAll('input.table_item_cbox[type="checkbox"]');
	checkboxes.forEach(function(item){
		item.checked = false;
	})
}
//设置选中范围
function set_scope(){
	empty_select();
	let min = 	document.getElementById('min_num').value;
	let max = 	document.getElementById('max_num').value;
	if(min>max){
		let a = min;
		min = max;
		max = a;
	}
	if(min<0 || max >= itemList.length){
		alert("设置不在合法范围内!")
		return;
	}
	let checkboxes = document.querySelectorAll('input.table_item_cbox[type="checkbox"]');
	for(let i = 0; i < checkboxes.length; i++){
		if(i >= min && i <= max){
			checkboxes[i].checked = true;
		}
	}
}

// 将函数挂载到全局对象
    window.count_all = count_all;
    window.count_before = count_before;
    window.count_later = count_later;
    window.count_select = count_select;
    window.select_all = select_all;
    window.empty_select = empty_select;
    window.set_scope = set_scope;



})();

