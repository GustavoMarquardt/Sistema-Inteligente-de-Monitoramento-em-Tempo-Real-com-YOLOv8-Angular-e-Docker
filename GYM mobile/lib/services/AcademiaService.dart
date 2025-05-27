// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AcademiaService {
  final String baseUrl =
      'http://localhost:3000'; // Substitua pela URL do seu back-end

  // Função para buscar academias com equipamentos
  Future<List<Map<String, dynamic>>> fetchAcademias() async {
    try {
      // Fazendo a requisição GET para o endpoint /academias
      final response = await http.get(Uri.parse('$baseUrl/lotacaoAcademias'));

      // Exibe o status code da resposta no console
      print('Status Code: ${response.statusCode}');

      // Se a resposta for bem-sucedida (status code 200)
      if (response.statusCode == 200) {
        // Decodificando a resposta JSON
        List<dynamic> jsonResponse = json.decode(response.body);

        // Exibe os dados recebidos no console
        //print('Dados recebidos: $jsonResponse');

        // Retorna a lista de academias
        return jsonResponse.map((e) => e as Map<String, dynamic>).toList();
      } else {
        // Caso a requisição falhe, lança uma exceção e exibe no console
        print(
            'Falha ao carregar academias. Status Code: ${response.statusCode}');
        throw Exception('Falha ao carregar academias');
      }
    } catch (e) {
      // Em caso de erro de rede ou exceções gerais, lança um erro
      print('Erro de conexão: $e');
      throw Exception('Erro de conexão: $e');
    }
  }

  Future<List<Map<String, dynamic>>> fetchAcademiaByID(String id) async {
    final String url =
        '$baseUrl/equipamentosOnly/academia/$id'; // Substitui :id pelo id real

    try {
      final response = await http.get(Uri.parse(url)); // Faz a requisição GET

      if (response.statusCode == 200) {
        // Se a resposta for bem-sucedida (código 200), converte o JSON para uma lista
        List<dynamic> data = json.decode(response.body);
        final responseReturn = List<Map<String, dynamic>>.from(data);
        print(responseReturn);
        return responseReturn;
      } else if (response.statusCode == 404) {
        // Se o código de resposta for 404, lança uma exceção com uma mensagem personalizada
        throw Exception('Nenhum aparelho cadastrado para essa academia');
      } else {
        // Para outros códigos de erro, exibe uma mensagem genérica
        throw Exception('Erro ao carregar academia: ${response.statusCode}');
      }
    } catch (e) {
      // Caso ocorra algum erro na requisição
      throw Exception('Erro ao buscar dados: $e');
    }
  }
}
