const express = require("express");
const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const EquipamentoModel = require("./src/models/Equipamento");
const CameraModel = require("./src/models/Camera")
const ManutencaoModel = require("./src/models/Manutencao");
const bodyParser = require("body-parser");
const cors = require("cors");
const Historico_uso_equipamento = require("./src/models/Historico_uso_equipamento");
const AcademiaModel = require("./src/models/Academia");
const HistoricoLotacaoModel = require("./src/models/Historico_lotacao");
const UsuarioDesktopModel = require("./src/models/UsuarioDesktop");
const RoisModel = require("./src/models/Rois");
const app = express();
const router = express.Router();
const path = require('path'); // Importando o módulo 'path'
const ffmpeg = require('fluent-ffmpeg'); // Importando o módulo 'fluent-ffmpeg'
const fs = require('fs');  // Importando o módulo fs
const { startOfDay, endOfDay } = require('date-fns');

app.use(cors({
  origin: ["http://localhost:4200", "http://localhost:65482"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Métodos permitidos
  allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos permitidos
}));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
    "script-src 'self' https://www.gstatic.com https://fonts.googleapis.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self'; " +
    "object-src 'none'; " +
    "frame-src 'none';"
  );
  next();
});



app.use(bodyParser.json());

// Configuração do banco de dados
const DB_NAME = "gym";
const DB_USER = "root";
const DB_PASSWORD = "sasukeNaruto";
const DB_HOST = "gymia-db-1";

// Função para criar o banco de dados, se necessário
async function createDatabaseIfNotExists() {
  try {
    console.log(`Tentando conectar ao banco de dados: ${DB_HOST}:${3306}`);

    // Criando a conexão com o MySQL
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    console.log(`Conexão estabelecida com o MySQL em ${DB_HOST}:${3306}`);

    // Tentando criar o banco de dados, se necessário
    console.log(`Tentando criar o banco de dados: ${DB_NAME}`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`Banco de dados ${DB_NAME} criado ou já existe.`);

    // Fechando a conexão
    await connection.end();
    console.log(`Conexão encerrada com sucesso.`);
  } catch (error) {
    console.error(`Erro ao tentar criar o banco de dados!`);
    console.error(error);
  }
}




async function initializeDatabase() {
  let sequelize;
  try {
    await createDatabaseIfNotExists();
    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      dialect: 'mysql',
    });

    await sequelize.authenticate();
    console.log('Conexão com o banco de dados bem-sucedida!');

    // Definição dos Modelos
    const Academia = AcademiaModel(sequelize, Sequelize.DataTypes); // Passando Sequelize.DataTypes
    const Equipamento = EquipamentoModel(sequelize, Sequelize.DataTypes); // Passando Sequelize.DataTypes
    const Camera = CameraModel(sequelize, Sequelize.DataTypes);
    const Manutencao = ManutencaoModel(sequelize, Sequelize.DataTypes); // Passando Sequelize.DataTypes
    const Historico = Historico_uso_equipamento(sequelize, Sequelize.DataTypes); // Passando Sequelize.DataTypes
    const HistoricoLotacao = HistoricoLotacaoModel(sequelize, Sequelize.DataTypes); // Nova classe HistoricoLotacao
    const UsuarioDesktop = UsuarioDesktopModel(sequelize, Sequelize.DataTypes); // Passando Sequelize.DataTypes
    const Rois = RoisModel(sequelize, Sequelize.DataTypes);
    // Relações entre os modelos
    Equipamento.hasMany(Manutencao, { foreignKey: 'id_equipamento', as: 'manutencoes', onDelete: 'CASCADE' });
    Manutencao.belongsTo(Equipamento, { foreignKey: 'id_equipamento', as: 'equipamento' });

    Historico.belongsTo(Equipamento, { foreignKey: 'id_equipamento', as: 'equipamento', onDelete: 'CASCADE' });

    Academia.hasMany(Equipamento, { foreignKey: 'idAcademia', as: 'equipamentos' });
    Equipamento.belongsTo(Academia, { foreignKey: 'idAcademia', as: 'academia' });

    Academia.hasMany(HistoricoLotacao, { foreignKey: 'idAcademia', as: 'historicos_lotacao' });
    HistoricoLotacao.belongsTo(Academia, { foreignKey: 'idAcademia', as: 'academia_lotacao' });

    Academia.hasMany(Camera, { foreignKey: 'idAcademia', as: 'cameras' });
    Camera.belongsTo(Academia, { foreignKey: 'idAcademia', as: 'academia' });

    Academia.hasMany(UsuarioDesktop, { foreignKey: 'academiaID', as: 'usuarios' });
    UsuarioDesktop.belongsTo(Academia, { foreignKey: 'academiaID', as: 'academia' });

    Camera.hasMany(Rois, { foreignKey: 'cameraId' });
    Rois.belongsTo(Camera, { foreignKey: 'cameraId' });

    Equipamento.hasMany(Rois, { foreignKey: 'idAparelho' });
    Rois.belongsTo(Equipamento, { foreignKey: 'idAparelho' });




    // Sincronização do banco
    await sequelize.sync({ alter: true });
    console.log('Banco de dados sincronizado!');

    return { Academia, Equipamento, Manutencao, Historico, Camera, UsuarioDesktop, Rois, HistoricoLotacao };
  } catch (error) {
    console.error('Erro ao conectar ou sincronizar o banco de dados:', error);
    process.exit(1);
  }
}





app.get("/", (req, res) => {

  res.json({
    mensagem: "API de gerenciamento de equipamentos e manutenções",
    rotas: [
      {
        equipamentos: [
          { metodo: "POST", descricao: "Cadastrar um novo equipamento" },
          { metodo: "GET", descricao: "Listar todos os equipamentos" },
          { metodo: "PUT", descricao: "Atualizar um equipamento existente" },
          { metodo: "DELETE", descricao: "Excluir um equipamento existente" },
        ],
      },
      {
        manutencoes: [
          { metodo: "POST", descricao: "Cadastrar uma nova manutenção" },
          { metodo: "GET", descricao: "Listar todas as manutenções" },
          { metodo: "PUT", descricao: "Atualizar uma manutenção existente" },
          { metodo: "DELETE", descricao: "Excluir uma manutenção existente" },
        ],

        Historico_uso_equipamento: [
          { metodo: "POST", descricao: "Cadastrar um novo historico de uso de equipamento" },
          { metodo: "GET", descricao: "Listar todos os historicos de uso de equipamento" },
          { metodo: "PUT", descricao: "Atualizar um historico de uso de equipamento existente" },
          { metodo: "DELETE", descricao: "Excluir um historico de uso de equipamento existente" },
        ],
      },
    ],
  });
});


// Inicializando o banco e configurando rotas
initializeDatabase().then(({ Equipamento, Manutencao, Historico, Academia, HistoricoLotacao,
  Camera, UsuarioDesktop, Rois }) => {


  router.post('/rois', async (req, res) => {
    const { cameraId, idAparelho, pontos, descricao } = req.body;

    if (!cameraId || !idAparelho || !pontos) {
      return res.status(400).json({ mensagem: 'ID da câmera, ID do aparelho e pontos são obrigatórios' });
    }

    try {
      const roi = await Rois.create({
        cameraId,
        idAparelho,
        pontos,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({ mensagem: 'ROI criado com sucesso', roi });
    } catch (error) {
      console.error('Erro ao criar ROI:', error);
      return res.status(500).json({ mensagem: 'Erro ao criar ROI', erro: error.message });
    }
  });

  // Buscar todos os ROIs
  router.get('/rois', async (req, res) => {
    try {
      const rois = await Rois.findAll();
      return res.status(200).json(rois);
    } catch (error) {
      console.error('Erro ao buscar ROIs:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar ROIs', erro: error.message });
    }
  });

  // Buscar ROI por ID
  router.get('/rois/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const roi = await Rois.findOne({ where: { id } });

      if (!roi) {
        return res.status(404).json({ mensagem: 'ROI não encontrado' });
      }

      return res.status(200).json(roi);
    } catch (error) {
      console.error('Erro ao buscar ROI por ID:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar ROI', erro: error.message });
    }
  });

  router.get('/roisByCameraAndAparelho', async (req, res) => {
    const { idAparelho, cameraId } = req.query;  // Recebe os parâmetros pela query string

    if (!idAparelho || !cameraId) {
      return res.status(400).json({ mensagem: 'idAparelho e cameraId são obrigatórios' });
    }

    try {
      // Busca o ROI baseado em idAparelho e cameraId
      const roi = await Rois.findOne({ where: { idAparelho, cameraId: cameraId } });

      // Verifica se o ROI foi encontrado
      if (!roi) {
        return res.status(200).json({ pontos: null });  // Se não encontrado, retorna null
      }

      return res.status(200).json({ pontos: roi.pontos });  // Retorna os pontos
    } catch (error) {
      console.error('Erro ao buscar ROI por idAparelho e cameraId:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar ROI', erro: error.message });
    }
  });

  router.get('/roisByCamera', async (req, res) => {
    const { cameraId } = req.query; // Recebe o parâmetro pela query string
    console.log('cameraId RECEBIDO:', cameraId);
    if (!cameraId) {
      return res.status(400).json({ mensagem: 'cameraId é obrigatório' }); // Valida se o parâmetro foi enviado
    }

    try {
      // Busca todos os ROIs relacionados ao cameraId
      const rois = await Rois.findAll({ where: { cameraId } });

      // Verifica se foram encontrados ROIs
      if (!rois || rois.length === 0) {
        return res.status(200).json([]); // Retorna uma lista vazia se não houver ROIs
      }

      // Retorna os ROIs encontrados
      console.log('ROIs encontrados:', rois);
      return res.status(200).json(rois);
    } catch (error) {
      console.error('Erro ao buscar ROIs por cameraId:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar ROIs', erro: error.message });
    }
  });


  router.put('/rois/:id', async (req, res) => {
    const { id } = req.params;
    const { pontos, descricao } = req.body;

    if (!pontos) {
      return res.status(400).json({ mensagem: 'Pontos são obrigatórios' });
    }

    try {
      const roi = await Rois.findOne({ where: { id } });

      if (!roi) {
        return res.status(404).json({ mensagem: 'ROI não encontrado' });
      }

      roi.pontos = pontos;
      roi.descricao = descricao || roi.descricao;
      roi.updatedAt = new Date();

      await roi.save();

      return res.status(200).json({ mensagem: 'ROI atualizado com sucesso', roi });
    } catch (error) {
      console.error('Erro ao atualizar ROI:', error);
      return res.status(500).json({ mensagem: 'Erro ao atualizar ROI', erro: error.message });
    }
  });

  router.delete('/rois/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const roi = await Rois.findOne({ where: { id } });

      if (!roi) {
        return res.status(404).json({ mensagem: 'ROI não encontrado' });
      }

      await roi.destroy();

      return res.status(200).json({ mensagem: 'ROI excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir ROI:', error);
      return res.status(500).json({ mensagem: 'Erro ao excluir ROI', erro: error.message });
    }
  });

  router.delete('/equipamentos/roi/:equipamentoId', async (req, res) => {
    const { equipamentoId } = req.params;

    try {
      // Buscar o ROI associado ao equipamentoId
      const roi = await Rois.findOne({ where: { idAparelho: equipamentoId } });

      if (!roi) {
        return res.status(404).json({ mensagem: 'ROI não encontrado para o equipamento especificado' });
      }

      // Excluir o ROI
      await roi.destroy();

      return res.status(200).json({ mensagem: 'ROI associado ao equipamento excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir ROI:', error);
      return res.status(500).json({ mensagem: 'Erro ao excluir ROI', erro: error.message });
    }
  });


  router.post('/calcular-roi-porcentagem', async (req, res) => {
    const { camerasIds } = req.body; // Espera-se que camerasIds  seja um array de IDs de câmeras
    console.log('Câmeras recebidas:', camerasIds);
    if (!Array.isArray(camerasIds) || camerasIds.length === 0) {
      return res.status(400).json({ mensagem: 'É necessário enviar uma lista de câmeras.' });
    }

    try {
      const resultado = [];

      for (const cameraId of camerasIds) {
        console.log('Verificando a câmera com id:', cameraId);

        // Pega os equipamentos dessa câmera
        const equipamentos = await Equipamento.findAll({ where: { cameraId } });

        // Pega os ROIs dessa câmera
        const rois = await Rois.findAll({ where: { cameraId } });
        if (!rois || rois.length === 0) {
          console.log(`Nenhum ROI encontrado para a câmera com ID: ${cameraId}`);
          resultado.push({
            cameraId: cameraId,
            totalEquipamentos: equipamentos.length,
            equipamentosComRoi: 0,
            porcentagemComRoi: '0.00',
          });
          continue;
        }

        // Calcula a porcentagem de equipamentos que já possuem ROI
        const equipamentosComRoi = equipamentos.filter(aparelho =>
          rois.some(roi => roi.idAparelho === aparelho.id)
        );

        const porcentagem = (equipamentosComRoi.length / equipamentos.length) * 100 || 0;

        resultado.push({
          cameraId: cameraId,
          totalEquipamentos: equipamentos.length,
          equipamentosComRoi: equipamentosComRoi.length,
          porcentagemComRoi: porcentagem.toFixed(2),
        });
      }



      return res.status(200).json(resultado);
    } catch (error) {
      console.error('Erro ao calcular porcentagens de ROI:', error);
      return res.status(500).json({ mensagem: 'Erro ao calcular porcentagens', erro: error.message });
    }
  });




  router.post('/criar-roi', async (req, res) => {
    const { cameraId, idAparelho, pontos, } = req.body;

    if (!pontos || pontos.length < 3) {
      return res.status(400).json({ mensagem: 'O ROI deve conter pelo menos três pontos.' });
    }

    try {
      const roi = await ROI.create({
        cameraId,
        idAparelho,
        pontos,
        descricao
      });

      return res.status(201).json({ mensagem: 'ROI criado com sucesso', roi });

    } catch (error) {
      console.error('Erro ao criar ROI:', error);
      return res.status(500).json({ mensagem: 'Erro ao criar ROI', erro: error.message });
    }
  });

  router.post('/equipamentos/checkRois', async (req, res) => {
    console.log('sasuke uchiha');
    const { idsAparelhos } = req.body; // Espera-se que idsAparelhos seja uma lista de IDs

    if (!Array.isArray(idsAparelhos) || idsAparelhos.length === 0) {
      return res.status(400).json({ mensagem: 'É necessário enviar uma lista de IDs de aparelhos.' });
    }

    try {
      const resultados = [];

      for (const idAparelho of idsAparelhos) {
        // Verifica se existe um ROI para o aparelho
        const roi = await Rois.findOne({ where: { idAparelho } });

        resultados.push({
          idAparelho,
          temRoi: roi !== null, // Verifica se existe um ROI para o idAparelho
        });
      }

      return res.status(200).json(resultados);
    } catch (error) {
      console.error('Erro ao verificar ROIs:', error);
      return res.status(500).json({ mensagem: 'Erro ao verificar ROIs', erro: error.message });
    }
  });



  // Rota para validar acesso
  router.post('/validar-acesso', async (req, res) => {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ mensagem: 'Login e senha são obrigatórios' });
    }

    try {
      const usuario = await UsuarioDesktop.findOne({ where: { login } });

      if (!usuario || usuario.senha !== senha) {
        return res.status(401).json({ mensagem: 'Senha ou usuário incorreto' });
      }

      const { id, nivelAcesso, academiaID } = usuario;
      return res.status(200).json({ mensagem: 'Acesso validado com sucesso', usuario: { id, nivelAcesso, academiaID } });

    } catch (error) {
      console.error('Erro ao validar acesso:', error);
      return res.status(500).json({ mensagem: 'Erro ao validar acesso', erro: error.message });
    }
  });

  // Rota para criar um novo usuário
  router.post('/usuarios', async (req, res) => {
    const { login, senha, academiaID, nivelAcesso } = req.body;

    if (!login || !senha || !academiaID || nivelAcesso === undefined) {
      return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
    }

    try {
      const novoUsuario = await UsuarioDesktop.create({ login, senha, academiaID, nivelAcesso });
      return res.status(201).json({ mensagem: 'Usuário criado com sucesso', usuario: novoUsuario });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ mensagem: 'Erro ao criar usuário', erro: error.message });
    }
  });

  // Rota para listar todos os usuários
  router.get('/usuarios', async (req, res) => {
    try {
      const usuarios = await UsuarioDesktop.findAll();
      return res.status(200).json({ mensagem: 'Usuários listados com sucesso', usuarios });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ mensagem: 'Erro ao listar usuários', erro: error.message });
    }
  });

  // Rota para atualizar um usuário
  router.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { login, senha, academiaID, nivelAcesso } = req.body;

    try {
      const usuarioAtualizado = await UsuarioDesktop.update(
        { login, senha, academiaID, nivelAcesso },
        { where: { id } }
      );

      if (usuarioAtualizado[0] === 0) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado' });
      }

      return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ mensagem: 'Erro ao atualizar usuário', erro: error.message });
    }
  });

  router.get('/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const usuario = await UsuarioDesktop.findOne({ where: { id } });

      if (!usuario) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado' });
      }

      return res.status(200).json(usuario);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ mensagem: 'Erro ao buscar usuário', erro: error.message });
    }
  });

  // Rota para atualizar apenas o academiaID de um usuário
  router.put('/usuarios/:id/academia', async (req, res) => {
    const { id } = req.params; // ID do usuário
    const { academiaID } = req.body; // Novo academiaID

    try {
      // Atualiza o academiaID do usuário correspondente ao ID
      const usuarioAtualizado = await UsuarioDesktop.update(
        { academiaID }, // Campos a serem atualizados
        { where: { id } } // Condição de busca
      );

      // Verifica se algum registro foi atualizado
      if (usuarioAtualizado[0] === 0) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado' });
      }

      return res.status(200).json({ mensagem: 'Academia atualizada com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar academia do usuário:', error);
      return res.status(500).json({ mensagem: 'Erro ao atualizar academia do usuário', erro: error.message });
    }
  });


  // Rota para excluir um usuário
  router.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const usuarioExcluido = await UsuarioDesktop.destroy({ where: { id } });

      if (usuarioExcluido === 0) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado' });
      }

      return res.status(200).json({ mensagem: 'Usuário excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return res.status(500).json({ mensagem: 'Erro ao excluir usuário', erro: error.message });
    }
  });


  router.post("/cameras", async (req, res) => {
    let cameras = req.body;
    console.log('Dados recebidos:', cameras);
  
    // Verifica se a requisição contém um único objeto ou um array de câmeras
    if (!Array.isArray(cameras)) {
      cameras = [cameras]; // Se for um único objeto, converte para um array
    }
  
    try {
      let camerasSalvas = [];
  
      // Salva as câmeras uma por uma, mesmo que seja um array
      for (let camera of cameras) {
        const { z, fov, alcance, x, y, rotationY, idAcademia, id } = camera;
  
        // Verifica se todos os campos necessários estão presentes
        if (
          z === undefined || fov === undefined || alcance === undefined ||
          x === undefined || y === undefined || rotationY === undefined ||
          idAcademia === undefined
        ) {
          return res.status(400).json({ mensagem: 'Dados incompletos ou inválidos.' });
        }
  
        // Verifica se já existe uma câmera com os mesmos dados (exceto id)
        const cameraExistente = await Camera.findOne({
          where: { z, fov, alcance, x, y, rotationY, idAcademia }
        });
  
        if (cameraExistente) {
          return res.status(409).json({ mensagem: 'Câmera com os mesmos dados já existe.' });
        }
  
        // Cria a câmera no banco de dados
        const cameraSalva = await Camera.create({ z, fov, alcance, x, y, rotationY, idAcademia });
        camerasSalvas.push(cameraSalva); // Adiciona a câmera salva ao array
      }
  
      // Retorna as câmeras salvas com sucesso
      res.status(201).json(camerasSalvas);
    } catch (error) {
      console.error('Erro ao salvar câmeras:', error);
      res.status(500).json({ mensagem: 'Erro ao criar câmeras', error: error.message });
    }
  });

  router.put("/camerasListUpdate", async (req, res) => {
    let cameras = req.body;
    console.log('Dados recebidos para atualização:', cameras);
  
    // Verifica se a requisição contém um único objeto ou um array de câmeras
    if (!Array.isArray(cameras)) {
      cameras = [cameras]; // Se for um único objeto, converte para um array
    }
  
    try {
      let camerasAtualizadas = [];
  
      for (let camera of cameras) {
        const { id, z, fov, alcance, x, y, rotationY, idAcademia } = camera;
  
        // Verifica se o campo id está presente
        if (!id) {
          return res.status(400).json({ mensagem: 'O campo id é obrigatório para atualização.' });
        }
  
        // Busca a câmera existente no banco de dados
        const cameraExistente = await Camera.findByPk(id);
  
        if (!cameraExistente) {
          return res.status(404).json({ mensagem: `Câmera com id ${id} não encontrada.` });
        }
  
        // Atualiza os dados da câmera
        await cameraExistente.update({ z, fov, alcance, x, y, rotationY, idAcademia });
  
        camerasAtualizadas.push(cameraExistente); // Adiciona a câmera atualizada ao array
      }
  
      // Retorna as câmeras atualizadas com sucesso
      res.status(200).json(camerasAtualizadas);
    } catch (error) {
      console.error('Erro ao atualizar câmeras:', error);
      res.status(500).json({ mensagem: 'Erro ao atualizar câmeras', error: error.message });
    }
  });
  
  

  // Função para capturar um frame da câmera RTSP usando FFmpeg
  function captureFrame(cameraUrl) {
    return new Promise((resolve, reject) => {
      const outputFilePath = path.join(__dirname, 'frame.jpg'); // Caminho do arquivo temporário para o frame

      ffmpeg(cameraUrl)
        .inputFormat('rtsp')
        .output(outputFilePath)
        .outputOptions('-vframes 1') // Captura apenas 1 frame
        .on('end', () => {
          resolve(outputFilePath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .run();
    });

  }
  router.get("/frameFromCamera", async (req, res) => {
    const { login_camera, senha_camera, ip_camera, port } = req.query;
  
    if (!login_camera || !senha_camera || !ip_camera || !port) {
      return res.status(400).json({ mensagem: "Faltando parâmetros da câmera." });
    }
  
    console.log('Parâmetros recebidos:', { login_camera, senha_camera, ip_camera, port });
  
    // Montando a URL RTSP com os parâmetros recebidos
    const cameraUrl = `rtsp://${login_camera}:${senha_camera}@${ip_camera}:${port}/stream1`;
    console.log('URL da câmera:', cameraUrl);
  
    try {
      // Gerar caminho para o arquivo temporário de imagem
      const framePath = path.join(__dirname, "output.jpg");
  
      // Usar ffmpeg para capturar um frame da câmera
      ffmpeg(cameraUrl)
        .inputOptions('-rtsp_transport', 'tcp') // Garantir que o transporte seja TCP
        .outputOptions('-vframes', '1')          // Capturar apenas 1 frame
        .on("start", () => {
          console.log("FFmpeg iniciando...");
        })
        .on("stderr", function (stderrLine) {
          console.log("FFmpeg STDERR:", stderrLine);
        })
        .on("end", function () {
          console.log('Frame capturado com sucesso:', framePath);
          res.sendFile(framePath, (err) => {
            if (err) {
              return res.status(500).json({ mensagem: "Erro ao enviar a imagem", error: err.message });
            }
  
            // Remover o arquivo temporário após o envio
            fs.unlinkSync(framePath);
            console.log('Arquivo temporário removido.');
          });
        })
        .on("error", function (err) {
          console.error("Erro ao capturar o frame da câmera:", err);
          res.status(500).json({ mensagem: "Erro ao capturar o frame da câmera", error: err.message });
        })
        .save(framePath);  // Salva o frame diretamente no caminho especificado
  
    } catch (error) {
      console.error("Erro ao capturar o frame da câmera:", error);
      res.status(500).json({ mensagem: "Erro ao capturar o frame da câmera", error: error.message });
    }
  });

  // READ: Listar todas as câmeras
  router.get("/cameras", async (req, res) => {
    try {
      const cameras = await Camera.findAll({
        include: { model: Academia, as: "academia" },
      });
      //console.log(cameras)
      res.status(200).json(cameras);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar câmeras", error: error.message });
    }
  });

  router.get("/cameras/academia/:idAcademia", async (req, res) => {
    try {
      const { idAcademia } = req.params;  // Pegando o idAcademia da URL

      // Buscando as câmeras com o idAcademia fornecido
      const cameras = await Camera.findAll({
        where: { idAcademia }, // Filtrando as câmeras pelo idAcademia
        include: { model: Academia, as: "academia" },  // Incluindo as informações da academia associada
      });

      // Se não encontrar câmeras para essa academia
      if (cameras.length === 0) {
        return res.status(404).json({ mensagem: "Nenhuma câmera encontrada para essa academia." });
      }

      //console.log(cameras);  // Verificando as câmeras encontradas
      res.status(200).json(cameras);  // Respondendo com as câmeras encontradas
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar câmeras", error: error.message });
    }
  });


  // READ: Buscar uma câmera por ID
  router.get("/cameras/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const camera = await Camera.findOne({
        where: { id },
        include: { model: Academia, as: "academia" },
      });

      if (!camera) {
        return res.status(404).json({ mensagem: "Câmera não encontrada" });
      }

      res.status(200).json(camera);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar câmera", error: error.message });
    }
  });

  router.get("/camerasmaxId", async (req, res) => {
    console.log('Rota /cameras/max-id foi chamada');
    try {
      // Tente buscar as câmeras primeiro
      const cameras = await Camera.findAll();
      console.log('Câmeras encontradas:', cameras);

      // Se não houver câmeras, retorna maxId como 0
      if (cameras.length === 0) {
        return res.status(200).json({ maxId: 0 });
      }

      // Se há câmeras, tente buscar o maior ID
      const maxId = await Camera.max('id');
      console.log('Maior ID:', maxId);

      // Se o maxId for null, isso indica que não há IDs no banco
      if (maxId === null) {
        return res.status(200).json({ maxId: 0 }); // Retorna 0 caso o maxId seja null
      }

      // Retorna o maxId encontrado
      res.status(200).json({ maxId });
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ mensagem: "Erro ao buscar maior id de câmeras", error: error.message });
    }
  });



  // // UPDATE: Atualizar os dados de uma câmera
  // router.put("/cameras/:id", async (req, res) => {
  //   const { id } = req.params;
  //   const { z, fov, alcance, x, y, rotationY, idAcademia } = req.body;

  //   try {
  //     const camera = await Camera.findByPk(id);
  //     if (!camera) {
  //       return res.status(404).json({ mensagem: "Câmera não encontrada" });
  //     }

  //     await camera.update({ z, fov, alcance, x, y, rotationY, idAcademia });
  //     res.status(200).json(camera);
  //   } catch (error) {
  //     res.status(500).json({ mensagem: "Erro ao atualizar câmera", error: error.message });
  //   }
  // });

  router.patch("/cameras/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    console.log("Tentando atualizar com dados:", updateData);

    try {
      const camera = await Camera.findByPk(id);

      if (!camera) {
        return res.status(404).json({ mensagem: "Câmera não encontrada" });
      }

      // Atualiza apenas os campos presentes no body
      await camera.update(updateData);

      res.status(200).json(camera);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar câmera", error: error.message });
    }
  });


  // DELETE: Excluir uma câmera
  router.delete("/cameras/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const camera = await Camera.findByPk(id);
      if (!camera) {
        return res.status(404).json({ mensagem: "Câmera não encontrada" });
      }

      await camera.destroy();
      res.status(200).json({ mensagem: "Câmera excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir câmera", error: error.message });
    }
  });

  // CRUD Academia 
  router.post("/academias", async (req, res) => {
    const { nome, ip_publico_academia, port, width, height, altura, endereco, numeroTelefone } = req.body;
    try {
      // Cria a academia sem a relação com os equipamentos
      const academia = await Academia.create({
        nome,
        endereco,
        ip_publico_academia,
        port,
        width,
        height,
        altura,
        numeroTelefone
      });

      // Retorna a academia sem os equipamentos relacionados
      res.status(201).json(academia);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao criar academia", error: error.message });
    }
  });


  router.get("/academias", async (req, res) => {
    try {
      const academias = await Academia.findAll({ include: { model: Equipamento, as: "equipamentos" } });
      res.status(200).json(academias);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar academias", error: error.message });
    }
  }
  );

  router.patch("/academiaUpdate/:id", async (req, res) => {
    const academiaId = req.params.id;  // ID da academia a ser atualizada
    const updatedData = req.body;  // Dados que serão atualizados
  
    try {
      // Buscar a academia pelo ID
      const academia = await Academia.findByPk(academiaId, {
        include: {
          model: Equipamento,  // Incluindo os equipamentos associados
          as: "equipamentos"
        }
      });
  
      if (!academia) {
        return res.status(404).json({ mensagem: "Academia não encontrada" });
      }
  
      // Atualizando os campos da academia com os dados recebidos no corpo da requisição
      await academia.update(updatedData);
  
      // Retorna a academia atualizada
      res.status(200).json({
        mensagem: "Academia atualizada com sucesso",
        academia: academia
      });
  
    } catch (error) {
      // Tratamento de erro
      res.status(500).json({
        mensagem: "Erro ao atualizar academia",
        error: error.message
      });
    }
  });
  


  router.get("/academias/:id", async (req, res) => {
    const { id } = req.params; // Captura o ID da URL

    try {
      // Busca a academia pelo ID, incluindo os equipamentos
      const academia = await Academia.findOne({
        where: { id },
        include: { model: Equipamento, as: "equipamentos" }
      });

      if (!academia) {
        // Retorna 404 se a academia não for encontrada
        return res.status(404).json({ mensagem: `Academia com id ${id} não encontrada` });
      }

      // Retorna a academia encontrada
      res.status(200).json(academia);
    } catch (error) {
      // Trata erros e retorna 500
      res.status(500).json({ mensagem: "Erro ao buscar academia", error: error.message });
    }
  });

  router.get("/lotacaoAcademias/:idAcademia", async (req, res) => {
    console.log("Consultando histórico...");
    const { idAcademia } = req.params;
  
    try {
      const historico = await HistoricoLotacao.findOne({
        where: { idAcademia },
        order: [["date", "DESC"]],
      });
  
      if (historico) {
        res.status(200).json(historico);
      } else {
        // Retornar quantidade 0 caso não tenha histórico
        res.status(200).json({ idAcademia, quantidadePessoas: 0, mensagem: "Nenhum histórico encontrado para essa academia" });
      }
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao consultar histórico", error: error.message });
    }
  });
  
  
  

  router.get("/lotacaoAcademiasById", async (req, res) => {
    console.log('Consultando histórico do dia...');
    const { idAcademia } = req.query;
    console.log('ID da Academia:', idAcademia);
  
    try {
      const startDate = startOfDay(new Date());
      const endDate = endOfDay(new Date());
  
      const historicos = await HistoricoLotacao.findAll({
        where: {
          idAcademia,
          date: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        },
        order: [['date', 'ASC']],
      });
  
      // Retorna sempre um array, mesmo que esteja vazio
      res.status(200).json(historicos);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao consultar histórico", error: error.message });
    }
  });
  



  router.put("/academias/:id", async (req, res) => {
    const { id } = req.params;
    const { nome, ip_academia, port, width, height, altura, endereco } = req.body;
    try {
      const academia = await Academia.findByPk(id);
      if (!academia) return res.status(404).json({ mensagem: "Academia não encontrada" });
      await academia.update({ nome, ip_academia, port, width, height, altura, endereco });
      res.status(200).json(academia);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar academia", error: error.message });
    }
  }
  );

  router.delete("/academias/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const academia = await Academia.findByPk(id);
      if (!academia) return res.status(404).json({ mensagem: "Academia não encontrada" });
      await academia.destroy();
      res.status(200).json({ mensagem: "Academia excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir academia", error: error.message });
    }
  }
  );

  router.patch('/lotacaoAcademias/:idAcademia', async (req, res) => {
    try {
      const { idAcademia, quantidade_pessoas, date } = req.body;
      
      // Procurar o histórico existente para a academia
      let historico = await HistoricoLotacao.findOne({ where: { idAcademia } });
  
      if (historico) {
        // Se encontrar o histórico, atualiza
        historico.quantidade_pessoas = quantidade_pessoas;
        historico.date = date;
        
        await historico.save(); // Salva as alterações
        res.status(200).json(historico); // Retorna o histórico atualizado
      } else {
        // Caso não encontre, cria um novo registro
        historico = await HistoricoLotacao.create({ idAcademia, quantidade_pessoas, date });
        res.status(201).json(historico); // Retorna o novo histórico criado
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.post("/lotacaoAcademias", async (req, res) => {
    const { idAcademia, quantidade_pessoas, date } = req.body;

    // Debug: Verificando os dados recebidos pela API
    console.log("Requisição recebida:", req.body);

    if (!date) {
        return res.status(400).json({ mensagem: "Date não pode ser nulo." });
    }

    if (quantidade_pessoas === null || quantidade_pessoas === undefined) {
        return res.status(400).json({ mensagem: "Quantidade de pessoas não pode ser nula." });
    }

    if (quantidade_pessoas <= 0) {
        return res.status(400).json({ mensagem: "Quantidade de pessoas deve ser maior que 0." });
    }

    console.log("Criando novo histórico de lotação para a academia com id:", idAcademia);
  
    try {
        // Criar um novo registro de histórico de lotação
        const novoHistorico = await HistoricoLotacao.create({
            idAcademia,
            quantidade_pessoas,
            date,
        });
        
        console.log("Novo histórico de lotação criado:", novoHistorico);
        res.status(201).json(novoHistorico);
    } catch (error) {
        console.log("Erro ao criar novo histórico de lotação:", error);
        res.status(500).json({ mensagem: "Erro ao criar novo histórico de lotação", error: error.message });
    }
});




  // Listar todos os registros de histórico de lotação
  router.get('/historicoLotacao/', async (req, res) => {
    try {
      const historicos = await HistoricoLotacao.findAll();
      res.status(200).json(historicos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/historicoLotacao/academia/:idAcademia', async (req, res) => {
    try {
      const { idAcademia } = req.params;
      const historicos = await HistoricoLotacao.findAll({
        where: { idAcademia }
      });

      if (historicos.length === 0) {
        return res.status(404).json({ message: 'Nenhum registro encontrado para essa academia' });
      }

      res.status(200).json(historicos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar um histórico específico pelo ID
  router.get('/historicoLotacao/:id', async (req, res) => {
    try {
      const historico = await HistoricoLotacao.findByPk(req.params.id);
      if (!historico) return res.status(404).json({ error: 'Registro não encontrado' });
      res.status(200).json(historico);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  
  const moment = require('moment');

router.get('/registerHistoricoLotacao', async (req, res) => {
  try {
    // Obtenção da data e hora atual em UTC
    const now = moment.utc(); // Hora atual em UTC
    const thirtyMinutesAgo = moment.utc().subtract(30, 'minutes'); // 30 minutos atrás em UTC

    console.log('now', now);  // Exibe a data atual em UTC
    console.log('thirtyMinutesAgo', thirtyMinutesAgo);  // Exibe a data de 30 minutos atrás em UTC

    // Formatando as datas para o formato adequado para o banco de dados (no formato UTC)
    const nowFormatted = now.format('YYYY-MM-DD HH:mm:ss');
    const thirtyMinutesAgoFormatted = thirtyMinutesAgo.format('YYYY-MM-DD HH:mm:ss');
    
    console.log('nowFormatted', nowFormatted);  // Exibe a data formatada em UTC
    console.log('thirtyMinutesAgoFormatted', thirtyMinutesAgoFormatted);  // Exibe a data de 30 minutos atrás formatada

    const historicosUso = await Historico.findAll({
      where: {
        [Op.or]: [
          // Histórico com data_inicio_uso dentro do intervalo entre thirtyMinutesAgo e now
          {
            data_inicio_uso: {
              [Op.gte]: thirtyMinutesAgoFormatted,  // Maior ou igual a 30 minutos atrás
              [Op.lte]: nowFormatted                // Menor ou igual a agora
            }
          },
          // Ou histórico onde data_fim_uso é null (em uso)
          {
            data_fim_uso: null
          }
        ]
      },
      include: [{
        model: Equipamento,
        as: 'equipamento', // Alias
        required: true,
        include: [{
          model: Academia,
          as: 'academia', // Alias
          required: true,
          attributes: ['id'] // Apenas o id da academia
        }],
        attributes: ['id', 'idAcademia'] // Equipamento e id da academia
      }]
    });

    console.log('historicosUso', historicosUso);  // Exibe os históricos de uso encontrados

    // Agora vamos agrupar os históricos por academia e calcular a quantidade de pessoas
    const lotacaoPorAcademia = {};

    historicosUso.forEach(historico => {
      const academiaId = historico.equipamento.idAcademia;

      // Se a academia não existir no objeto lotacaoPorAcademia, cria um
      if (!lotacaoPorAcademia[academiaId]) {
        lotacaoPorAcademia[academiaId] = {
          quantidade_pessoas: 0,
          academiaId
        };
      }

      // Incrementa a quantidade de pessoas
      lotacaoPorAcademia[academiaId].quantidade_pessoas++;
    });

    // Agora, vamos registrar na tabela HistoricoLotacao
    for (const academiaId in lotacaoPorAcademia) {
      const lotacao = lotacaoPorAcademia[academiaId];

      // Criar o registro de lotação para cada academia
      await HistoricoLotacao.create({
        quantidade_pessoas: lotacao.quantidade_pessoas,
        date: nowFormatted, // Data atual formatada em UTC
        idAcademia: academiaId // Referência à academia
      });
    }

    res.status(200).json({ message: 'Histórico de lotação registrado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar o histórico de lotação' });
  }
});


  router.get("/historico_equipamento_uso/ativo/:id_equipamento", async (req, res) => {
    const { id_equipamento } = req.params;
    console.log('verificando', id_equipamento)
    try {
      // Verifica se existe algum registro ativo (onde data_fim_uso é null)
      const registroAtivo = await Historico.findOne({
        where: { id_equipamento, data_fim_uso: null },
      });

      if (registroAtivo) {
        return res.status(200).json({
          mensagem: `Registro ativo encontrado para o aparelho ${id_equipamento}.`,
          ativo: true,
        });
      } else {
        return res.status(200).json({
          mensagem: `Nenhum registro ativo encontrado para o aparelho ${id_equipamento}.`,
          ativo: false,
        });
      }
    } catch (error) {
      res.status(500).json({
        mensagem: "Erro ao verificar o registro ativo.",
        error: error.message,
      });
    }
  });



  router.post("/historico_equipamento_uso/inicio", async (req, res) => {
    const { id_equipamento, data_inicio_uso } = req.body;

    if (!id_equipamento || !data_inicio_uso) {
      return res.status(400).json({
        mensagem: "Os campos 'id_equipamento' e 'data_inicio_uso' são obrigatórios.",
      });
    }

    try {
      // Verifica se já existe um registro ativo (data_fim_uso == null)
      const registroAtivo = await Historico.findOne({
        where: { id_equipamento, data_fim_uso: null },
      });

      if (registroAtivo) {
        return res.status(400).json({
          mensagem: "Já existe um registro de uso ativo para este equipamento.",
        });
      }

      // Cria um novo registro
      const historico = await Historico.create({
        id_equipamento,
        data_inicio_uso,
        data_fim_uso: null,
      });

      res.status(201).json({
        mensagem: "Registro de uso iniciado com sucesso.",
        historico,
      });
    } catch (error) {
      res.status(500).json({
        mensagem: "Erro ao iniciar o uso do equipamento.",
        error: error.message,
      });
    }
  });

  router.patch("/historico_equipamento_uso/fim", async (req, res) => {
    const { id_equipamento, data_fim_uso } = req.body;

    if (!id_equipamento || !data_fim_uso) {
      return res.status(400).json({
        mensagem: "Os campos 'id_equipamento' e 'data_fim_uso' são obrigatórios.",
      });
    }

    try {
      // Busca um registro ativo (data_fim_uso == null)
      const registroAtivo = await Historico.findOne({
        where: { id_equipamento, data_fim_uso: null },
      });

      if (!registroAtivo) {
        return res.status(404).json({
          mensagem: "Nenhum registro ativo encontrado para este equipamento.",
        });
      }

      // Atualiza o registro com a data de fim
      registroAtivo.data_fim_uso = data_fim_uso;
      await registroAtivo.save();

      res.status(200).json({
        mensagem: "Registro de uso finalizado com sucesso.",
        registroAtivo,
      });
    } catch (error) {
      res.status(500).json({
        mensagem: "Erro ao finalizar o uso do equipamento.",
        error: error.message,
      });
    }
  });


  router.get("/historico_equipamento_uso", async (req, res) => {
    try {
      const historico = await Historico.findAll({
        include: {
          model: Equipamento,
          as: "equipamento", // Certifique-se de que o alias está correto
        },
      });
      if (historico.length === 0) return res.status(201).json({ mensagem: "Nenhum Histórico encontrado" });
      console.log(historico)
      res.status(200).json(historico);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar historico", error: error.message });
    }
  });
  const { Op } = require("sequelize");

  router.post("/historico_equipamento_uso/byIds", async (req, res) => {
    try {
      const { ids } = req.body; // Obter a lista de IDs do corpo da requisição
      console.log(ids)
      // Verificar se a lista de IDs foi fornecida
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ mensagem: "IDs inválidos ou ausentes" });
      }

      // Consultar históricos correspondentes aos IDs fornecidos
      const historico = await Historico.findAll({
        where: {
          id_equipamento: {
            [Op.in]: ids, // Filtrar históricos cujo ID esteja na lista
          },
        },
        include: {
          model: Equipamento,
          as: "equipamento", // Certifique-se de que o alias está correto
        },
      });
      console.log('historico', historico)
      // Verificar se foram encontrados registros
      if (historico.length === 0) {
        return res.status(404).json({ mensagem: "Nenhum histórico encontrado para os IDs fornecidos" });
      }
      res.status(200).json(historico);
    } catch (error) {
      // Tratar erros e retornar resposta apropriada
      res.status(500).json({ mensagem: "Erro ao buscar históricos", error: error.message });
    }
  });


  router.post("/historico_equipamento_uso/byIdsToday", async (req, res) => {
    try {
      const { ids } = req.body; // Obter a lista de IDs do corpo da requisição
      console.log(ids);

      // Verificar se a lista de IDs foi fornecida
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ mensagem: "IDs inválidos ou ausentes" });
      }

      // Obter a data atual
      const hoje = new Date();
      const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
      const fimDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

      // Consultar históricos correspondentes aos IDs fornecidos e ao dia atual
      const historicoHoje = await Historico.findAll({
        where: {
          id_equipamento: {
            [Op.in]: ids, // Filtrar históricos cujo ID esteja na lista
          },
          data_inicio_uso: {
            [Op.between]: [inicioDoDia, fimDoDia], // Filtrar históricos do dia atual
          },
        },
        include: {
          model: Equipamento,
          as: "equipamento", // Certifique-se de que o alias está correto
        },
      });

      console.log('historicoHoje', historicoHoje);

      // Verificar se foram encontrados registros
      if (historicoHoje.length === 0) {
        return res.status(400).json({ mensagem: "Nenhum histórico encontrado para os IDs fornecidos no dia atual" });
      }

      res.status(200).json(historicoHoje);
    } catch (error) {
      // Tratar erros e retornar resposta apropriada
      res.status(500).json({ mensagem: "Erro ao buscar históricos do dia atual", error: error.message });
    }
  });



  router.put("/historico_equipamento_uso/:id", async (req, res) => {
    const { id } = req.params;
    const { data_inicio, data_fim, descricao, status } = req.body;
    try {
      const historico = await Historico.findByPk(id);
      if (!historico) return res.status(404).json({ mensagem: "Historico não encontrado" });
      await historico.update({ data_inicio, data_fim, descricao, status });
      res.status(200).json(historico);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar historico", error: error.message });
    }
  });

  router.delete("/historico_equipamento_uso/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const historico = await Historico.findByPk(id);
      if (!historico) return res.status(404).json({ mensagem: "Historico não encontrado" });
      await historico.destroy();
      res.status(200).json({ mensagem: "Historico excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir historico", error: error.message });
    }
  });
  router.patch('/equipamentosNovaCameraResponsavel', async (req, res) => {
    console.log('Requisição PATCH recebida para atualizar câmera responsável');
    console.log('Corpo da requisição:', req.body); // Verifique o corpo da requisição

    try {
      const { aparelhoId, cameraId } = req.body; // Espera um objeto com aparelhoId e cameraId

      // Verifica se ambos os parâmetros foram fornecidos
      if (!aparelhoId || !cameraId) {
        return res.status(400).json({ mensagem: 'aparelhoId e cameraId são obrigatórios' });
      }

      // Busca o equipamento pelo ID
      const equipamento = await Equipamento.findByPk(aparelhoId);
      if (!equipamento) {
        return res.status(404).json({ mensagem: 'Equipamento não encontrado' });
      }

      // Atualiza a câmera responsável
      await equipamento.update({ cameraId });

      res.status(200).json({
        mensagem: 'Câmera responsável atualizada com sucesso',
        equipamento,
      });
    } catch (error) {
      res.status(500).json({ mensagem: 'Erro ao atualizar equipamento', error: error.message });
    }
  });



  router.post("/equipamentos", async (req, res) => {
    const {
      nome_equipamento,
      cameraId,
      altura,
      largura,
      profundidade,
      x,
      y,
      isParede,
      data_aquisicao,
      status,
      idAcademia,
      divisao
    } = req.body;

    console.log("Dados recebidos:", req.body);

    try {
      // Verifique se a Academia com o idAcademia existe
      const academia = await Academia.findByPk(idAcademia);
      if (!academia) {
        return res.status(400).json({ mensagem: "Academia não encontrada" });
      }

      const equipamento = await Equipamento.create({
        nome_equipamento,
        cameraId,
        altura: parseFloat(altura),
        largura: parseFloat(largura),
        profundidade: parseFloat(profundidade),
        x: parseFloat(x),
        y: parseFloat(y),
        isParede,
        data_aquisicao: new Date(data_aquisicao),
        status,
        idAcademia,
        divisao,
        ocupado:0
      });

      res.status(201).json(equipamento);
    } catch (error) {
      console.error("Erro ao criar equipamento:", error); // Verifique o erro no console
      res.status(500).json({ mensagem: "Erro ao criar equipamento", error: error.message });
    }
  });


  // Listar equipamentos
  router.get("/equipamentos", async (req, res) => {
    try {
      // Incluindo a academia e a manutenção relacionada ao equipamento
      const equipamentos = await Equipamento.findAll({
        include: [
          { model: Manutencao, as: "manutencoes" },
          { model: Academia, as: "academia" }  // Incluindo a associação com a Academia
        ]
      });
      res.status(200).json(equipamentos);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar equipamentos", error: error.message });
    }
  });


  // Atualizar parcialmente equipamentos
  router.patch("/equipamentos", async (req, res) => {
    console.log("Requisição PATCH recebida do cliente");
    console.log("Corpo da requisição:", req.body);  // Verifique o corpo da requisição

    try {
      const aparelhos = req.body; // Espera uma lista de aparelhos para atualizar parcialmente

      // Garantir que a lista não está vazia
      if (!aparelhos || aparelhos.length === 0) {
        return res.status(400).json({ mensagem: "Nenhum aparelho fornecido para atualização" });
      }

      const aparelhosAtualizados = [];

      // Itera sobre a lista de aparelhos e realiza a atualização
      for (const aparelho of aparelhos) {
        const { id, nome_equipamento, cameraId, altura, largura, profundidade, x, y, isParede, data_aquisicao, status, idAcademia } = aparelho;

        // Busca o equipamento pelo ID
        const equipamento = await Equipamento.findByPk(id);
        if (!equipamento) {
          aparelhosAtualizados.push({ id, mensagem: "Equipamento não encontrado" });
          continue; // Se o equipamento não for encontrado, pula para o próximo
        }

        // Atualiza os dados parcialmente do equipamento
        await equipamento.update({
          nome_equipamento,
          cameraId,
          altura,
          largura,
          profundidade,
          x,
          y,
          isParede,
          data_aquisicao,
          status,
          idAcademia
        });

        aparelhosAtualizados.push({ id, mensagem: "Equipamento atualizado com sucesso", equipamento });
      }

      res.status(200).json(aparelhosAtualizados);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar equipamentos", error: error.message });
    }
  });


  // Listar equipamentos por ID da academia
  router.get("/equipamentos/academia/:idAcademia", async (req, res) => {
    const { idAcademia } = req.params;
    console.log('salve')
    try {
      // Busca equipamentos relacionados à academia pelo ID fornecido
      const equipamentos = await Equipamento.findAll({
        where: { idAcademia: idAcademia }, // Filtra pelo ID da academia
        include: [
          { model: Manutencao, as: "manutencoes" },
          { model: Academia, as: "academia" } // Inclui a associação com a Academia
        ]
      });

      if (equipamentos.length === 0) {
        return res.status(404).json({ mensagem: "Nenhum equipamento encontrado para esta academia" });
      }
      console.log(equipamentos)
      res.status(200).json(equipamentos);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar equipamentos", error: error.message });
    }
  });

  router.get("/equipamentosOnly/academia/:idAcademia", async (req, res) => {
    const { idAcademia } = req.params; // Obtém o ID da academia a partir dos parâmetros da URL
    try {
      // Busca todos os equipamentos com base no idAcademia
      const equipamentos = await Equipamento.findAll({
        where: { idAcademia: idAcademia }, // Filtra os equipamentos pela academia
        attributes: ['id', 'nome_equipamento', 'status', 'ocupado', 'divisao', 'altura', 'largura', 'profundidade', 'x', 'y', 'cameraId'], // Defina os atributos que deseja retornar
      });

      if (equipamentos.length === 0) {
        return res.status(404).json({ mensagem: "Nenhum equipamento encontrado para esta academia." });
      }

      res.status(200).json(equipamentos); // Retorna os equipamentos encontrados
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar equipamentos", error: error.message });
    }
  });

  // Atualizar parcialmente o campo 'ocupado' do equipamento
  router.patch("/equipamentos/:id", async (req, res) => {
    const { id } = req.params;
    const { ocupado } = req.body;  // Recebe o valor de 'ocupado' do corpo da requisição

    try {
      const equipamento = await Equipamento.findByPk(id);
      if (!equipamento) {
        return res.status(404).json({ mensagem: "Equipamento não encontrado" });
      }

      // Atualizando o campo 'ocupado' do equipamento
      await equipamento.update({ ocupado });

      res.status(200).json({ mensagem: "Equipamento atualizado com sucesso", equipamento });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar equipamento", error: error.message });
    }
  });



  // Atualizar equipamento
  router.put("/equipamentos/:id", async (req, res) => {
    const { id } = req.params;
    const {
      nome_equipamento,
      cameraId,
      altura,
      largura,
      profundidade,
      x,
      y,
      isParede,
      data_aquisicao,
      status,
      idAcademia
    } = req.body;

    try {
      const equipamento = await Equipamento.findByPk(id);
      if (!equipamento) return res.status(404).json({ mensagem: "Equipamento não encontrado" });

      // Atualizando os dados do equipamento
      await equipamento.update({
        nome_equipamento,
        cameraId,
        altura,
        largura,
        profundidade,
        x,
        y,
        isParede,
        data_aquisicao,
        status,
        idAcademia
      });

      res.status(200).json(equipamento);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar equipamento", error: error.message });
    }
  });

  router.get("/equipamentos/camera/:cameraId", async (req, res) => {
    const { cameraId } = req.params;

    try {
      // Busca todos os equipamentos com o cameraId fornecido
      const equipamentos = await Equipamento.findAll({
        where: {
          cameraId: cameraId,
        },
      });

      if (equipamentos.length === 0) {
        return res.status(404).json({ mensagem: "Nenhum equipamento encontrado para essa câmera." });
      }

      res.status(200).json(equipamentos);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar equipamentos", error: error.message });
    }
  });


  // Excluir equipamento
  router.delete("/equipamentos/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const equipamento = await Equipamento.findByPk(id);
      if (!equipamento) return res.status(404).json({ mensagem: "Equipamento não encontrado" });

      // Excluindo o equipamento
      await equipamento.destroy();
      res.status(200).json({ mensagem: "Equipamento excluído com sucesso" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir equipamento", error: error.message });
    }
  });


  // CRUD Manutencao
  router.post("/manutencoes", async (req, res) => {
    const { id_equipamento, data_inicio_manutencao, data_fim_manutencao, ultima_manutencao, descricao, custo_manutencao, status } = req.body;
    try {
      const manutencao = await Manutencao.create({
        id_equipamento,
        data_inicio_manutencao,
        data_fim_manutencao,
        ultima_manutencao,
        descricao,
        custo_manutencao,
        status,
      });
      res.status(201).json(manutencao);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao criar manutenção", error: error.message });
    }
  });

  router.get("/manutencoes", async (req, res) => {
    try {
      const manutencoes = await Manutencao.findAll({ include: { model: Equipamento, as: "equipamento" } });
      res.status(200).json(manutencoes);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao buscar manutenções", error: error.message });
    }
  });

  router.put("/manutencoes/:id", async (req, res) => {
    const { id } = req.params;
    const { data_inicio_manutencao, data_fim_manutencao, ultima_manutencao, descricao, custo_manutencao, status } = req.body;
    try {
      const manutencao = await Manutencao.findByPk(id);
      if (!manutencao) return res.status(404).json({ mensagem: "Manutenção não encontrada" });
      await manutencao.update({
        data_inicio_manutencao,
        data_fim_manutencao,
        ultima_manutencao,
        descricao,
        custo_manutencao,
        status,
      });
      res.status(200).json(manutencao);
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao atualizar manutenção", error: error.message });
    }
  });

  router.delete("/manutencoes/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const manutencao = await Manutencao.findByPk(id);
      if (!manutencao) return res.status(404).json({ mensagem: "Manutenção não encontrada" });
      await manutencao.destroy();
      res.status(200).json({ mensagem: "Manutenção excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ mensagem: "Erro ao excluir manutenção", error: error.message });
    }
  });



  // Inicia o servidor
  app.use("/", router);
  const PORT = 3000;
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
});
