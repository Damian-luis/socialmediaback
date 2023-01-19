/*const mysql = require('mysql2')
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '1234',
    database : 'socialmedia'
  });
module.exports={
    connection:()=>{
        
          connection.connect(function(err) {
            if (err) {
              console.error('error connecting: ' + err.stack);
              return;  
            }
           
            console.log('connected as id ' + connection.threadId);
          });
        
          app.listen(PORT,()=>{console.log(`servidor corriendo en puerto${PORT}`)})
    }
}
*/