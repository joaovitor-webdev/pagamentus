-- Bancos lógicos independentes para cada ambiente local.
CREATE DATABASE pagamentus_dev;
CREATE DATABASE pagamentus_test;
CREATE DATABASE pagamentus_prod;

GRANT ALL PRIVILEGES ON DATABASE pagamentus_dev TO usuario_fake;
GRANT ALL PRIVILEGES ON DATABASE pagamentus_prod TO usuario_fake;
GRANT ALL PRIVILEGES ON DATABASE pagamentus_test TO usuario_fake;
