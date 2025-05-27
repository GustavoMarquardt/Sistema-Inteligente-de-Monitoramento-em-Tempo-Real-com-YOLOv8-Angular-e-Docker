import 'package:flutter/material.dart';
import 'home_page.dart'; // Importa a tela MyHomePage

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _isVisible = true;

  @override
  void initState() {
    super.initState();

    // Exibe a imagem por 1 segundo, depois faz desaparecer
    Future.delayed(const Duration(seconds: 1), () {
      setState(() {
        _isVisible = false;
      });
    });

    // Navega para a próxima tela após 2 segundos
    Future.delayed(const Duration(seconds: 2), () {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => MyHomePage()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF141332), // Cor de fundo #141332
      body: Center(
        child: AnimatedOpacity(
          opacity:
              _isVisible ? 1.0 : 0.0, // A imagem vai aparecer e desaparecer
          duration: const Duration(seconds: 1),
          child: Image.asset(
            'assets/images/gymia512.png', // Substitua pelo caminho correto da sua imagem
            width: 200, // Ajuste o tamanho conforme necessário
            height: 200,
          ),
        ),
      ),
    );
  }
}
