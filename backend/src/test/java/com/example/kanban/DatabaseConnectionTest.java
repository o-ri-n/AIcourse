package com.example.kanban;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * docker compose で起動した PostgreSQL に実際に接続できることを確認する。
 * 事前に `docker compose up -d` を実行しておくこと。DB が停止中なら失敗する。
 */
@SpringBootTest
class DatabaseConnectionTest {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void canExecuteQuery() {
		Integer result = jdbcTemplate.queryForObject("select 1", Integer.class);
		assertThat(result).isEqualTo(1);
	}

	@Test
	void connectedToPostgres() {
		String version = jdbcTemplate.queryForObject("select version()", String.class);
		assertThat(version).contains("PostgreSQL");
	}

	@Test
	void connectedToKanbanDatabase() {
		String name = jdbcTemplate.queryForObject("select current_database()", String.class);
		assertThat(name).isEqualTo("kanban");
	}

}
