import time
import cv2
from ultralytics import YOLO
import os
import requests
import json
import numpy as np
from PIL import Image, ImageDraw

# Load YOLOv8 model
model = YOLO("yolov8m.pt")  # replace with the correct path to YOLOv8 weights
url = 'http://backend:3000/'
def draw_boxes(image, boxes):
    """Desenha caixas delimitadoras na imagem."""
    draw = ImageDraw.Draw(image)
    for box in boxes:
        x_min, y_min, x_max, y_max = box

        # Garantir que y_max >= y_min e x_max >= x_min
        if y_max < y_min:
            y_min, y_max = y_max, y_min
        if x_max < x_min:
            x_min, x_max = x_max, x_min

        draw.rectangle([x_min, y_min, x_max, y_max], outline="red", width=3)
    return image

def get_camera_object(camera_data):
    """Cria um objeto CameraRTSP com os dados necessários."""
    camera = CameraRTSP(
        id=camera_data['id'],
        id_academia=camera_data['idAcademia'],
        login_camera=camera_data['login_camera'],
        senha_camera=camera_data['senha_camera'],
        ip_camera=camera_data['ip_camera'],
        port=camera_data['port']
    )
    return camera

class CameraRTSP:
    """Classe para armazenar as informações da câmera e gerar URLs RTSP."""
    def __init__(self, id, id_academia, login_camera, senha_camera, ip_camera, port):
        self.id = id
        self.id_academia = id_academia
        self.login_camera = login_camera
        self.senha_camera = senha_camera
        self.ip_camera = ip_camera
        self.port = port

    def get_url(self):
        """Constrói a URL RTSP com as credenciais fornecidas."""
        return f"rtsp://{self.login_camera}:{self.senha_camera}@{self.ip_camera}:{self.port}/stream1"

class ROI:
    """Classe para definir uma região de interesse (ROI) com coordenadas x, y."""  
    def __init__(self, id, cameraId, idAparelho, pontos):
        self.id = id
        self.cameraId = cameraId
        self.idAparelho = idAparelho
        # Aqui, pontos já é uma lista de dicionários, então não precisamos de json.loads
        self.pontos = pontos  

    def get_pontos(self):
        """Retorna as coordenadas da ROI no formato de lista de pontos (x, y)."""
        return self.pontos


import subprocess
import numpy as np
import cv2

def capture_frame(rtsp_url):
    """Captura um frame único do stream RTSP usando FFmpeg e OpenCV."""
    ffmpeg_command = [
        'ffmpeg', '-rtsp_transport', 'tcp',  # Garante que o RTSP use TCP
        '-analyzeduration', '100M', '-probesize', '100M',  # Aumenta a análise
        '-i', rtsp_url,
        '-f', 'image2pipe',  # Usar o pipe para enviar a imagem
        '-vframes', '1', 
        '-pix_fmt', 'bgr24',  # Forçar o formato de pixel para BGR (compatível com OpenCV)
        '-vcodec', 'png',  # Use PNG para um formato mais seguro
        '-'
    ]
    
    #print('Tentando capturar frame...')
    # Executa o comando ffmpeg, redirecionando a saída para o pipe
    pipe = subprocess.Popen(ffmpeg_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = pipe.communicate()

    # Imprimir erros do ffmpeg, caso existam
    if stderr:
         print(f"Erro ao executar ffmpeg:")
        # print(f"Erro ao executar ffmpeg: {stderr.decode()}")

    # Verificar se o stdout não está vazio
    if len(stdout) == 0:
        print("Não foi possível capturar o frame. stdout está vazio.")
        return None

    # Usando uma abordagem de buffer temporário para o arquivo de imagem
    nparr = np.frombuffer(stdout, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Verificar se o frame foi decodificado corretamente
    if frame is not None:
        print('Imagem capturada com sucesso!')
        return frame
    else:
        print('Falha ao decodificar a imagem.')
        return None

    
def get_cameras_from_bd():
    """Função que faz uma requisição GET à rota '/cameras' para buscar as câmeras no banco de dados."""
    try:
        # URL do servidor onde a API está sendo executada
        api_url = f"{url}/cameras"  # Concatena a URL base com o caminho '/cameras'
        #print('URL',api_url)
        # Realizar a requisição GET
        response = requests.get(api_url)

        # Verificar se a requisição foi bem-sucedida
        if response.status_code == 200:
            # Parse do JSON com as câmeras
            cameras = response.json()
            camera_objects = []

            # Criar objetos CameraRTSP para cada câmera recebida
            for camera_data in cameras:
                camera_objects.append(get_camera_object(camera_data))
            
            return camera_objects
        else:
            print(f"Erro ao buscar câmeras. Status code: {response.status_code}")
            return None
    except Exception as e:
        print(f"Ocorreu um erro ao buscar as câmeras: {e}")
        return None


    
import requests

def get_ROIs_from_bd_by_camera(cameraId):
    """Função que busca os ROIs do banco de dados pela câmera via API."""

    # URL da sua API
    api_url = f"{url}roisByCamera?cameraId={cameraId}"
    #print(f"Consultando API: {api_url}")
    
    try:
        # Faz a requisição para buscar os ROIs
        response = requests.get(api_url)
        
        # Verifica se a resposta foi bem-sucedida
        if response.status_code == 200:
            try:
                # Tenta processar a resposta como JSON
                rois_data = response.json()
                #print(f"Dados recebidos da API: {rois_data}")
                #print(f"Tipo de dado de rois_data: {type(rois_data)}")  # Verificando o tipo
                
                # Verifica se a resposta é uma lista válida
                if isinstance(rois_data, list):  # Verifica se é uma lista
                    #print('é uma instancia')
                    rois = []

                    for roi_data in rois_data:
                        #print('tem roi dentro de data')
                        if 'pontos' in roi_data:
                         #   print('existe a chave pontos')
                            roi = ROI(
                                id=roi_data['id'],  # Passando o id recebido
                                cameraId=roi_data['cameraId'],
                                idAparelho=roi_data['idAparelho'],
                                pontos=roi_data['pontos']
                            )
                            rois.append(roi)
                        else:
                            print(f"Erro: 'pontos' não encontrado para o ROI com idAparelho {roi_data['idAparelho']}")

                    if rois:
                        return rois
                    else:
                        print("Não há ROIs configurados para esta câmera.")
                        return []
                else:
                    print("Erro: Dados recebidos não são uma lista válida.")
                    return []
            except Exception as e:
                print(f"Erro ao processar o JSON recebido: {e}")
                return []
        else:
            print(f"Erro ao buscar ROIs: Status code {response.status_code}")
            return []
    
    except Exception as e:
        print(f"Erro ao fazer a requisição: {e}")
        return []

def delete_file(file_path):
    """Deleta o arquivo se o caminho for válido."""
    if isinstance(file_path, str) and len(file_path) > 0:
        try:
            os.remove(file_path)
            print(f"Arquivo {file_path} deletado com sucesso.")
        except Exception as e:
            print(f"Erro ao deletar o arquivo: {e}")


def update_stats_off_aparelho(id_aparelho, ocupado):
    api_url = f"{url}/equipamentos/{id_aparelho}"

    payload = {
        "ocupado": ocupado  # O valor de "ocupado" agora é passado como parâmetro
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        # Faz a requisição PATCH para atualizar o aparelho
        response = requests.patch(api_url, json=payload, headers=headers)

        # Verifica se a resposta foi bem-sucedida
        if response.status_code == 200:
            print(f"Aparelho {id_aparelho} atualizado com sucesso!")
            #print(response.json())  # Exibe o retorno da API
        else:
            print(f"Erro ao atualizar o aparelho {id_aparelho}: {response.status_code}")
           # print(response.json())  # Exibe o erro, se houver
    except Exception as e:
        print(f"Ocorreu um erro ao tentar atualizar o aparelho {id_aparelho}: {e}")
    

# Função para recortar as regiões de interesse
def crop_image_by_roi(image, rois):
    """Recorta a imagem de acordo com as ROIs e retorna as imagens recortadas."""
    cropped_images = []
    for roi in rois:
        pontos = roi.get_pontos()
        #print("Pontos:", pontos)  # Adicione esta linha para inspecionar os dados dos pontos
        # Certifique-se de que você tem 4 pontos para formar um retângulo (ou qualquer outro formato de ROI)
        if len(pontos) == 4:
            # Aqui, estou assumindo que os pontos são quadrantes do retângulo
            x1, y1 = pontos[0]['x'], pontos[0]['y']  # Ponto inicial
            x2, y2 = pontos[2]['x'], pontos[2]['y']  # Ponto oposto
            # Recorte da imagem
            cropped_img = image[int(y1):int(y2), int(x1):int(x2)]
            cropped_images.append(cropped_img)
        else:
            print(f"Erro: O número de pontos para a ROI não é 4, mas {len(pontos)}")
    return cropped_images
from datetime import datetime


def save_historico_uso_aparelho(id_aparelho):
    """Chama a API para iniciar o histórico de uso do equipamento"""
    api_url = f"{url}/historico_equipamento_uso/inicio"
    data_inicio_uso = datetime.now().isoformat()  # Data no formato ISO 8601

    payload = {
        "id_equipamento": id_aparelho,
        "data_inicio_uso": data_inicio_uso
    }

    try:
        response = requests.post(api_url, json=payload)
        if response.status_code == 201:
            data = response.json()
            print(data.get("mensagem", "Uso iniciado com sucesso"))
            update_stats_off_aparelho(id_aparelho, True)  # Usar True para indicar que o aparelho está ocupado
        else:
            print("Erro ao acessar a API:", response.json().get("mensagem", "Erro desconhecido"))
    except Exception as e:
        print(f"Erro ao acessar a API: {e}")

        
def save_historico_fim_uso_aparelho(id_aparelho):
    """Chama a API para finalizar o histórico de uso do equipamento"""
    api_url = f"{url}/historico_equipamento_uso/fim"
    data_fim_uso = datetime.now().isoformat()  # Data no formato ISO 8601

    payload = {
        "id_equipamento": id_aparelho,
        "data_fim_uso": data_fim_uso
    }

    try:
        response = requests.patch(api_url, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(data.get("mensagem", "Uso finalizado com sucesso"))
            update_stats_off_aparelho(id_aparelho, False)  # Usar False para indicar que o aparelho não está mais ocupado
        else:
            print("Erro ao acessar a API:", response.json().get("mensagem", "Erro desconhecido"))
    except Exception as e:
        print(f"Erro ao acessar a API: {e}")
        
from collections import defaultdict

from datetime import datetime, timedelta
def process_image(rtsp_url, camera_id, roi, camera, academia_counts):
    """Captura a imagem, aplica a ROI e passa para o modelo YOLO para detectar pessoas."""
    # Captura a imagem do stream RTSP
    image_path = capture_frame(rtsp_url)
    
    # Verifica se a captura foi bem-sucedida
    if image_path is None or not isinstance(image_path, np.ndarray):  # Verifica se é um array NumPy válido
        print("Erro: Imagem não capturada corretamente.")
        return None

    # Carrega a imagem
    img = cv2.imread(image_path)

    # Usa os pontos da ROI para recortar a imagem
    points = roi.get_pontos()
    if len(points) < 4:
        return None

    # Extrai os pontos da ROI para obter as coordenadas do retângulo
    x1, y1 = points[0]['x'], points[0]['y']
    x2, y2 = points[2]['x'], points[2]['y']

    # Certifique-se de que as coordenadas sejam inteiros
    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

    # Recorta a imagem com base nas coordenadas da ROI
    cropped_img = img[y1:y2, x1:x2]

    # Perform inference on the cropped image
    results = model(cropped_img)

    # Inicializa a lista para armazenar resultados de detecção
    result_images = []
    detected_person = False

    # Filter results for 'person' class
    person_class = 0
    for result in results[0].boxes:
        x1, y1, x2, y2 = result.xyxy[0]
        conf = result.conf[0]
        cls = result.cls[0]

        if cls == person_class and conf > 0.1:
            detected_person = True
            # Imprimir a porcentagem de certeza no console
            print(f"Pessoa detectada com {conf * 100:.2f}% de certeza.")

    result_images.append(cropped_img)

    # Se alguém foi detectado, salvar histórico de uso com o id do aparelho
    if detected_person:
        save_historico_uso_aparelho(roi.idAparelho)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = f"detections/camera_{camera_id}_roi_{roi.id}_{timestamp}.jpg"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        # cv2.imwrite(save_path, cropped_img)
        print(f"Imagem salva em: {save_path}")

        # Incrementa o contador de pessoas para a academia correspondente
        academia_counts[camera.id_academia] += 1  # Somando o número de pessoas para a academia
        
    else:
        print('Chamando a função para salvar fim do uso')
        save_historico_fim_uso_aparelho(roi.idAparelho)

    # Deletar o arquivo de imagem original após o processamento
    delete_file(image_path)

    return result_images



from datetime import datetime, timedelta, timezone
import os
import cv2
import requests
import time
from collections import defaultdict
import time
import os
from datetime import datetime, timezone

# Variáveis globais para controle de intervalos
last_cleanup_time = time.time()  # Armazena o timestamp da última limpeza
CLEANUP_INTERVAL = 120  # Intervalo em segundos

def process_image(rtsp_url, camera_id, roi, camera, academia_counts):
    """Captura a imagem, aplica a ROI e passa para o modelo YOLO para detectar pessoas."""
    # Captura a imagem do stream RTSP
    image_path = capture_frame(rtsp_url)
    if image_path is None or not isinstance(image_path, np.ndarray):
        print("Erro: Imagem não capturada corretamente.")
        return None

    # Carrega a imagem
    img = image_path  # Aqui usamos a imagem diretamente

    # Usa os pontos da ROI para recortar a imagem
    points = roi.get_pontos()
    if len(points) < 4:
        return None

    # Extrai os pontos da ROI para obter as coordenadas do retângulo
    x1, y1 = points[0]['x'], points[0]['y']
    x2, y2 = points[2]['x'], points[2]['y']

    # Certifique-se de que as coordenadas sejam inteiros
    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

    # Recorta a imagem com base nas coordenadas da ROI
    cropped_img = img[y1:y2, x1:x2]

    # Perform inference on the cropped image
    results = model(cropped_img)

    # Inicializa a lista para armazenar resultados de detecção
    result_images = []
    detected_person = False

    # Filter results for 'person' class
    person_class = 0
    for result in results[0].boxes:
        x1, y1, x2, y2 = result.xyxy[0]
        conf = result.conf[0]
        cls = result.cls[0]

        if cls == person_class and conf > 0.1:
            detected_person = True
            # Imprimir a porcentagem de certeza no console
            print(f"Pessoa detectada com {conf * 100:.2f}% de certeza.")

    result_images.append(cropped_img)

    # Se alguém foi detectado, salvar histórico de uso com o id do aparelho
    if detected_person:
        save_historico_uso_aparelho(roi.idAparelho)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        # USAR S3 NA AWS
        save_path = f"detections/camera_{camera_id}_roi_{roi.id}_{timestamp}.jpg"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        cv2.imwrite(save_path, cropped_img)
        print(f"Imagem salva em: {save_path}")

        # Incrementa o contador de pessoas para a academia correspondente
        academia_counts[camera.id_academia] += 1  # Somando o número de pessoas para a academia
        
    else:
        print('Chamando a função para salvar fim do uso')
        save_historico_fim_uso_aparelho(roi.idAparelho)

    # Deletar o arquivo de imagem original após o processamento
    delete_file(image_path)

    # Limpeza periódica após um intervalo de tempo
    clean_directory_after_interval(f"detections/")

    return result_images

def clean_directory_after_interval(folder_path):
    """Remove os arquivos fora da pasta após o intervalo definido."""
    global last_cleanup_time  # Usar a variável global
    current_time = time.time()

    # Verifica se o intervalo foi atingido
    if current_time - last_cleanup_time >= CLEANUP_INTERVAL:
        print(f"Limpando arquivos antigos no diretório {folder_path}...")
        for root, _, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"Arquivo removido: {file_path}")
                except OSError as e:
                    print(f"Erro ao remover {file_path}: {e}")

        # Atualiza o tempo da última limpeza
        last_cleanup_time = current_time


import requests
from datetime import datetime, timezone, timedelta

def update_historico_lotacao(camera, academia_counts):
    """Atualiza o histórico de lotação da academia com base no número de pessoas detectadas."""
    try:
        id_academia = camera.id_academia
        quantidade_pessoas = academia_counts.get(id_academia, 0)

        print(f"Quantidade de pessoas para idAcademia {id_academia}: {quantidade_pessoas}")

        if quantidade_pessoas is None or quantidade_pessoas == 0:
            print(f"Erro: quantidade_pessoas para idAcademia {id_academia} é None ou 0.")
            return

        timestamp_atual = datetime.now(timezone.utc).isoformat()
        api_url = f"http://backend:3000/lotacaoAcademias/{id_academia}"

        response = requests.get(api_url)
        if response.status_code != 200:
            print(f"Erro ao consultar histórico de lotação: {response.status_code} - {response.text}")
            return

        historico = response.json()
        if isinstance(historico, dict):
            historico = [historico]

        registro_atualizado = False

        for record in historico:
            if 'date' not in record:
                continue

            date_str = record['date'].replace("Z", "+00:00")
            date_registro = datetime.fromisoformat(date_str)

            if datetime.now(timezone.utc) - date_registro < timedelta(minutes=30):
                quantidade_existente = record.get('quantidade_pessoas', -1)

                if quantidade_pessoas > quantidade_existente:
                    record['quantidade_pessoas'] = quantidade_pessoas
                    record['date'] = timestamp_atual

                    update_url = f"http://backend:3000/lotacaoAcademias/{record['id']}"
                    update_response = requests.patch(update_url, json=record)

                    if update_response.status_code == 200:
                        print(f"Histórico de lotação atualizado: {update_response.text}")
                    else:
                        print(f"Erro ao atualizar histórico: {update_response.status_code} - {update_response.text}")
                    registro_atualizado = True
                else:
                    print(f"Não há necessidade de atualizar o histórico para a academia {id_academia}.")
                    return

        # Cria novo registro apenas se não atualizou nenhum dentro do intervalo de 30 minutos
        if not registro_atualizado:
            api_url = "http://backend:3000/lotacaoAcademias"
            novo_registro = {
                'idAcademia': id_academia,
                'quantidade_pessoas': quantidade_pessoas,
                'date': timestamp_atual
            }

            print(f"Enviando para API: idAcademia={id_academia}, quantidade_pessoas={quantidade_pessoas}, date={timestamp_atual}")
            create_response = requests.post(api_url, json=novo_registro)

            if create_response.status_code == 201:
                print(f"Novo histórico de lotação criado: {create_response.text}")
            else:
                print(f"Erro ao criar novo histórico: {create_response.status_code} - {create_response.text}")

    except Exception as e:
        print(f"Ocorreu um erro ao consultar ou atualizar o histórico de lotação: {e}")



def main():
    # Dicionário para contar as pessoas por academia (reiniciado a cada execução da main)
    academia_counts = defaultdict(int)
    
    # Fetch camera data
    cameras = get_cameras_from_bd()
    if not cameras:
        print("Não foi possível obter as câmeras.")
        return

    # Loop through cameras and process each one
    for camera in cameras:
        print(f"Processando câmera {camera.id}...")

        # Get the RTSP URL for the camera
        rtsp_url = camera.get_url()
        print(rtsp_url)
        # Get ROIs associated with this camera
        rois = get_ROIs_from_bd_by_camera(camera.id)
        if not rois:
            print(f"Não há ROIs configurados para a câmera {camera.id}.")
            continue

        # Process the image stream from the camera
        for roi in rois:
            print(f"Processando ROI {roi.id} para a câmera {camera.id}...")

            # Passar a câmera para o processamento da imagem
            result_images = process_image(rtsp_url, camera.id, roi, camera, academia_counts)
            if not result_images:
                print(f"Não foi possível processar a imagem para a ROI {roi.id} da câmera {camera.id}.")
                continue
    print('------------------------------------------------------------------------------------------------------------------------')
    # Após processar todas as câmeras, atualizar o histórico de lotação de cada academia
    for camera in cameras:
        update_historico_lotacao(camera, academia_counts)

if __name__ == "__main__":
    while True:
        print('iniciando iterações')
        main()
        print("Aguardando 2 minutos")
        time.sleep(120)
