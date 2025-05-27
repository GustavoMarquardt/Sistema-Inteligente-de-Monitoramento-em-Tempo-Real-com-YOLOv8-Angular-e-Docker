const Sequelize = require('sequelize');

// Configuração inicial para conectar sem um banco de dados específico
const sequelizeInicial = new Sequelize(
    '',            // Nome do banco de dados vazio, para permitir a conexão
    'root',        // Nome de usuário
    'sasukeNaruto', // Senha
    {
        host: 'db', // Altere de 'localhost' para 'db'
        port: 3306,
        dialect: 'mysql',
        logging: true,
        charset: 'utf8mb4',
    }
);


const conectar = async function () {
    try {
        // Conexão inicial para criar o banco de dados, se necessário
        await sequelizeInicial.authenticate();
        console.log(`\n--> Conexão inicial estabelecida para verificar/criar o banco de dados.`);

        // Cria o banco de dados, caso ele não exista
        await sequelizeInicial.query('CREATE DATABASE IF NOT EXISTS SDES06;');

        // Configuração com o banco de dados especificado
        const sequelize = new Sequelize(
            'GYM',        // Nome do banco de dados
            'root',          // Nome de usuário
            '',              // Senha (vazia neste caso)
            {
                host: process.env.DB_HOST || 'db',
                port: 3306,
                dialect: 'mysql',
                logging: true,
                define: {
                    timestamps: false,
                    freezeTableName: true,
                },
            }
        );

        // Conecta ao banco de dados criado
        await sequelize.authenticate();
        console.log(`\n--> Conexão estabelecida com o banco de dados 'SDES06'.`);

        // Sincroniza as tabelas de acordo com os modelos definidos
        await sequelize.sync({ alter: true });
        console.log('Tabelas criadas e sincronizadas com sucesso.');

        return sequelize;  // Retorna a instância do Sequelize
    } catch (error) {
        console.error(`\nErro ao conectar ao banco de dados ou criar as tabelas!`);
        console.error(error);
        throw error;
    }
};

module.exports = {
    conectar: conectar,
};
