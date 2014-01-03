var mysql = require('mysql');
 var config = require('../config');
 
 // ModelBase: Modelのベースクラス
 var Database_mysql = function () {};
 
 // データベースの認証情報を格納する
 Database_mysql.prototype.dbAuth = config.databaseAuth;
 
 // MySQLクライアントオブジェクトを作成する
 Database_mysql.prototype._getClient = function () {
   if (this.client === undefined) {
     this.client = mysql.createConnection(this.dbAuth);
   }
   return this.client;
 };
 
 // クエリを実行する
 Database_mysql.prototype.query = function (query, params, callback) {
   var client = this._getClient();
   return client.query(query, params, callback);
 };
 
 // クエリを終了する
 Database_mysql.prototype.end = function (callback) {
   if (this.client) {
     this.client.end(callback);
     delete this.client;
   }
 };
 
 // Databaseクラスのインスタンスを作成する
 function createClient() {
   return new Database_mysql();
 };
 
 exports.createClient = createClient;