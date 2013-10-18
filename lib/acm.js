/*
	从couchdb数据库中读取测试用例（和题目对应，JSON格式）
	用测试用例作为输入，执行js代码
	判断是否正确，返回测试结果以及执行的分数
	{
		result: Accepted|Compile Error|Runtime Error|Timeout|Wrong Answer|Permission Denied,
		cases: case数,
		exec_time: 代码平均执行时间（总时间/case数）,
		start_time: 代码提交时间,
		username: 用户名,
	}
*/

module.exports = (function(){

'use strict';

var conf = {
	user: 'work',
	passwd: 'wed%401234',
	host: 'water.weizoo.com',
	port: 5984
};

var casesDB = require('then-couchdb').createClient(
	'http://' + conf.user + ":" + conf.passwd + '@' + conf.host 
	+ ":" + conf.port + '/cases' 
);

var when = require('when');

/*casesDB.get('1001').then(function(data){
	console.log(data);
});*/

function compile(code){
	
	var task = new Function("return " + code);

	var ret = null;
	try{
	 	ret = task();
	}catch(ex){
		ret = ex;
	}
	return ret;
}

function runCases(func, cases){
	var ret = {
		result: 'accepted',
		cases: cases.length,
		exec_time: 0,
		start_time: Date.now(),
	};

	cases.forEach(function(_case){
		var args = _case.args;
		var result = func.apply(this, args);
		if(result !== _case.result){
			ret.result = 'wrong answer';
		}
	});

	if(cases.length > 0){
		ret.exec_time = Math.round((Date.now() - ret.start_time)/cases.length);
	}

	return ret;
}

function run(id, code){
	var res = {},
		func = compile(code),
		deferred = when.defer();


	if(func == null || func instanceof Error){
		res.result = 'compile error';
		deferred.resolve(res);
	}

	casesDB.get(id).then(function(data){
		res = runCases(func, data.cases);
		deferred.resolve(res);
	}).otherwise(function(){
		res.result = 'runtime error';
		deferred.resolve(res);
	});

	return deferred.promise;
}

/*run('1001', "function(a,b){return a+b}")
	.then(function(res){
		console.log(res);
	});*/

return {
	run: run
};

})();
