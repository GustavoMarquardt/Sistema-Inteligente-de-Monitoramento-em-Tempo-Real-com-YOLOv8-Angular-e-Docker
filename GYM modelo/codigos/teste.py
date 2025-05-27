import cv2
from ultralytics import YOLO
import os
import requests
import json
import numpy as np
from PIL import Image, ImageDraw

# Load YOLOv8 model
model = YOLO("yolov8n.pt")  # replace with the correct path to YOLOv8 weights

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
    def __init__(self, cameraId, idAparelho, pontos):
        self.cameraId = cameraId
        self.idAparelho = idAparelho
        # As coordenadas são passadas como uma string JSON, então devemos convertê-las
        self.pontos = json.loads(pontos)  # Converte a string JSON para lista de dicionários

    def get_pontos(self):
        """Retorna as coordenadas da ROI no formato de lista de pontos (x, y)."""
        return self.pontos

def capture_frame(rtsp_url):
    """Captura um frame único do stream RTSP usando OpenCV."""
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        print("Erro ao abrir o stream RTSP.")
        return None

    ret, frame = cap.read()
    cap.release()

    if ret:
        # Salvar o frame capturado
        OUTPUT_FRAME = "captured_frame.jpg"
        cv2.imwrite(OUTPUT_FRAME, frame)
        return OUTPUT_FRAME
    else:
        print("Falha ao capturar o frame.")
        return None
    
def get_cameras_from_bd():
    """Função que faz uma requisição GET à rota '/cameras' para buscar as câmeras no banco de dados."""
    try:
        # URL do servidor onde a API está sendo executada
        url = "http://localhost:3000/cameras"  # Substitua pela URL do seu servidor

        # Realizar a requisição GET
        response = requests.get(url)

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


    
def get_ROIs_from_bd_by_camera(cameraId):
    """Função que busca os ROIs do banco de dados pela câmera via API."""

    # URL da sua API
    url = f'http://localhost:3000/roisByCamera?cameraId={cameraId}'
    
    try:
        # Faz a requisição para buscar os ROIs
        response = requests.get(url)
        
        # Verifica se a resposta foi bem-sucedida
        if response.status_code == 200:
            rois_data = response.json()  # Dados dos ROIs no formato JSON
            
            # Imprimir os dados retornados para inspecionar
            print("Dados recebidos da API:", rois_data)
            
            # Lista para armazenar os objetos ROI
            rois = []
            
            # Cria instâncias da classe ROI para cada item recebido
            for roi_data in rois_data:
                # Verificar se a chave 'coordinates' existe na resposta
                if 'coordinates' in roi_data:
                    roi = ROI(
                        cameraId=roi_data['cameraId'],
                        idAparelho=roi_data['idAparelho'],
                        coordinates=roi_data['coordinates']
                    )
                    rois.append(roi)
                else:
                    print(f"Erro: 'coordinates' não encontrado para o ROI com idAparelho {roi_data['idAparelho']}")
            
            return rois
        
        else:
            print(f"Erro ao buscar ROIs: {response.status_code}")
            return []
    
    except Exception as e:
        print(f"Erro ao fazer a requisição: {e}")
        return []


def delete_file(file_path):
    """Deleta o arquivo após o processamento."""
    try:
        os.remove(file_path)
        print(f"Arquivo {file_path} deletado com sucesso.")
    except OSError as e:
        print(f"Erro ao tentar deletar o arquivo {file_path}: {e}")

def get_ROIs_from_bd_by_camera(cameraId):
    """Função que busca os ROIs do banco de dados pela câmera via API."""
    # URL da sua API
    url = f'http://localhost:3000/roisByCamera?cameraId={cameraId}'
    
    try:
        # Faz a requisição para buscar os ROIs
        response = requests.get(url)
        
        # Verifica se a resposta foi bem-sucedida
        if response.status_code == 200:
            rois_data = response.json()  # Dados dos ROIs no formato JSON
            
            # Lista para armazenar os objetos ROI
            rois = []
            
            # Cria instâncias da classe ROI para cada item recebido
            for roi_data in rois_data:
                # Verificar se a chave 'pontos' existe na resposta
                if 'pontos' in roi_data:
                    roi = ROI(
                        cameraId=roi_data['cameraId'],
                        idAparelho=roi_data['idAparelho'],
                        pontos=roi_data['pontos']
                    )
                    rois.append(roi)
                else:
                    print(f"Erro: 'pontos' não encontrado para o ROI com idAparelho {roi_data['idAparelho']}")
            
            return rois
        
        else:
            print(f"Erro ao buscar ROIs: {response.status_code}")
            return []
    
    except Exception as e:
        print(f"Erro ao fazer a requisição: {e}")
        return []

# Função para recortar as regiões de interesse
def crop_image_by_roi(image, rois):
    """Recorta a imagem de acordo com as ROIs e retorna as imagens recortadas."""
    cropped_images = []
    for roi in rois:
        pontos = roi.get_pontos()
        for ponto in pontos:
            x1, y1 = ponto['x1'], ponto['y1']
            x2, y2 = ponto['x2'], ponto['y2']
            
            # Recorte da imagem
            cropped_img = image[y1:y2, x1:x2]
            cropped_images.append(cropped_img)
    return cropped_images
def process_image(rtsp_url, camera_id, roi):
    """Captura a imagem, aplica o ROI e passa para o modelo YOLO para detectar pessoas."""
    # Captura a imagem do stream RTSP
    image_path = capture_frame(rtsp_url)
    if not image_path:
        return None

    # Carrega a imagem
    img = cv2.imread(image_path)

    # Usa os pontos da ROI para recortar a imagem
    points = roi.get_pontos()  # Obtém os pontos da ROI
    if len(points) < 4:  # Verifica se a ROI tem pelo menos 4 pontos (esquina superior esquerda e inferior direita)
        return None

    # Extrai os pontos da ROI para obter as coordenadas do retângulo
    x1, y1 = points[0]['x'], points[0]['y']  # Ponto superior esquerdo
    x2, y2 = points[2]['x'], points[2]['y']  # Ponto inferior direito

    # Recorta a imagem com base nas coordenadas da ROI
    cropped_img = img[y1:y2, x1:x2]

    # Inicializa a lista para armazenar resultados de detecção
    result_images = []

    # Perform inference on the cropped image
    results = model(cropped_img)

    # Filter results for 'person' class
    person_class = 0  # In COCO, 'person' class is 0
    for result in results[0].boxes:  # Accessing boxes directly from the result
        # result format: [x1, y1, x2, y2, confidence, class]
        x1, y1, x2, y2 = result.xyxy[0]  # Get bounding box coordinates
        conf = result.conf[0]  # Confidence score
        cls = result.cls[0]  # Class ID

        if cls == person_class and conf > 0.2:  # Confidence threshold
            # Draw rectangle around detected person
            cv2.rectangle(cropped_img, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            
            # Format confidence as percentage
            confidence_percentage = f"{conf * 100:.1f}%"
            
            # Display the label and confidence
            label = f"person {confidence_percentage}"
            cv2.putText(cropped_img, label, (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    result_images.append(cropped_img)

    # Deletar o arquivo de imagem original após o processamento
    delete_file(image_path)
    
    return result_images


import os

def main():
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

        # Get ROIs associated with this camera
        rois = get_ROIs_from_bd_by_camera(camera.id)
        if not rois:
            print(f"Não há ROIs configurados para a câmera {camera.id}.")
            continue

        # Process the image stream from the camera
        for roi in rois:
            print(f"Processando ROI {roi.id} para a câmera {camera.id}...")

            result_images = process_image(rtsp_url, camera.id, roi)  # Passar a ROI para o processamento
            if not result_images:
                print(f"Não foi possível processar a imagem para a ROI {roi.id} da câmera {camera.id}.")
                continue

            # For demonstration, display the first result image (optional)
            if result_images:
                cv2.imshow(f"Resultado da Câmera {camera.id} - ROI {roi.id}", result_images[0])
                cv2.waitKey(0)
                cv2.destroyAllWindows()

