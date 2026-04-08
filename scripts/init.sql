CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, description, status)
VALUES
  ('Create auth screens', 'Build login and registration screens in the frontend.', 'planned'),
  ('Connect API routes', 'Wire the backend routes to the Postgres database.', 'in_progress'),
  ('Prepare deployment', 'Add deployment variables and production build steps.', 'done');

