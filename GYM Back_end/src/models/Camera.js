const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Camera = sequelize.define('Camera', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            validate: {
                isNonZero(value) {
                    if (value === 0) {
                        throw new Error('O id não pode ser 0.');
                    }
                },
            },
        },
        z: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        fov: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        alcance: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        x: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        y: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        rotationY: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        idAcademia: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Academia', // Nome da tabela relacionada
                key: 'id', // Nome da coluna na tabela relacionada
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        ip_camera: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        port: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        login_camera: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        senha_camera: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        timestamps: false, // Desabilita os campos createdAt e updatedAt
    });

    // Funções para manipulação de câmeras
    Camera.cadastrar_camera = async (camera) => {
        try {
            const novaCamera = await Camera.create(camera);
            return { status: 200, mensagem: 'Camera cadastrada com sucesso!', camera: novaCamera };
        } catch (error) {
            console.error('Erro ao cadastrar câmera:', error);
            return { status: 500, mensagem: 'Erro ao cadastrar câmera' };
        }
    };

    Camera.listar_cameras = async () => {
        try {
            const cameras = await Camera.findAll();
            return { status: 200, cameras };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    };

    Camera.atualizar_camera = async (camera) => {
        try {
            const updatedCamera = await Camera.update(camera, { where: { id: camera.id } });
            return { status: 200, updatedCamera };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    };

    Camera.excluir_camera = async (id) => {
        try {
            const deletedCamera = await Camera.destroy({ where: { id } });
            return { status: 200, message: 'Câmera excluída com sucesso!' };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    };

    return Camera;
};
