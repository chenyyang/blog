---
layout: default
title:  Spring JdbcTemplate使用
categories:
  - spring

---
# {{ page.title }}

   JdbcTemplate是spring对数据库使用的封装。

   JdbcTemplate将我们使用的JDBC的流程封装起来，包括了异常的捕捉、SQL的执行、查询结果的转换等等。spring大量使用Template Method模式来封装固定流程的动作，XXXTemplate等类别都是基于这种方式的实现。 
   
   除了大量使用Template Method来封装一些底层的操作细节，spring也大量使用callback方式类回调相关类别的方法以提供JDBC相关类别的功能，使传统的JDBC的使用者也能清楚了解spring所提供的相关封装类别方法的使用。 

##1. 创建

创建mysql的连接：

        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("com.mysql.jdbc.Driver");
        ds.setUrl("jdbc:mysql://127.0.0.1:3306/user");
        ds.setUsername("root");
        ds.setPassword("password");
        JdbcTemplate jdbcTemplate = new JdbcTemplate();
        jdbcTemplate.setDataSource(ds);


##2. 执行SQL语句无返回

	jdbcTemplate.execute("CREATE TABLE USER (user_id integer, name varchar(100))"); 

##3. update()方法可以执行update和insert语句，返回修改行数

        jdbcTemplate.update("INSERT INTO USER VALUES('"
                + user.getId() + "', '"
                + user.getName() + "', '"
                + user.getSex() + "', '"
                + user.getAge() + "')");

##4. 外部参数

	jdbcTemplate.update("UPDATE USER SET name = ? WHERE user_id = ?", new Object[] {name, id});

##5. 查询返回指定类型(基本类型)

int:

	int count = jdbcTemplate.queryForInt("SELECT COUNT(*) FROM USER");

String:

	String name = (String) jdbcTemplate.queryForObject("SELECT name FROM USER WHERE user_id = ?", new Object[] {id}, java.lang.String.class);

List:
	List rows = jdbcTemplate.queryForList("SELECT * FROM USER");

	List rows = jdbcTemplate.queryForList("SELECT * FROM USER");
	Iterator it = rows.iterator();
	while(it.hasNext()) {
    		Map userMap = (Map) it.next();
    		System.out.print(userMap.get("user_id") + "\t");
    		System.out.print(userMap.get("name") + "\t");
    		System.out.print(userMap.get("sex") + "\t");
    		System.out.println(userMap.get("age") + "\t");
	}

##6. 传入java bean参数 

        final User user = new User();
        jdbcTemplate.update("INSERT INTO USER VALUES(?, ?, ?, ?)",
                new PreparedStatementSetter() {
                    public void setValues(PreparedStatement ps) throws SQLException {
                        ps.setString(1, user.getId());
                        ps.setString(2, user.getName());
                        ps.setString(3, user.getSex());
                        ps.setInt(4, user.getAge());
                    }
                });

##7. 返回java bean

        final User user = new User();
        jdbcTemplate.query("SELECT * FROM USER WHERE user_id = ?",
                new Object[] {id},
                new RowCallbackHandler() {
                    public void processRow(ResultSet rs) throws SQLException {
                        user.setId(rs.getString("user_id"));
                        user.setName(rs.getString("name"));
                        user.setSex(rs.getString("sex").charAt(0));
                        user.setAge(rs.getInt("age"));
                    }
                });

##8.  直接返回java bean

    static class UserRowMapper implements RowMapper {

        @Override
        public Object mapRow(ResultSet rs, int index) throws SQLException {
            User user = new User();
            user.setUserId(rs.getLong("user_id"));
            user.setName(rs.getString("name"));
            user.setAge(rs.getInt("age"));
            user.setBirthday(rs.getDate("birthday"));
            return user;
        }

    }
    //调用
    List<User> list = jdbcTemplate.query(sql, new UserRowMapper());
    for(User user1: list)
        System.out.println(" user : "+user1);


