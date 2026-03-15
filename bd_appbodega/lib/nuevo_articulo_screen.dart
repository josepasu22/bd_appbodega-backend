import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NuevoArticuloScreen extends StatefulWidget {
  const NuevoArticuloScreen({super.key});

  @override
  _NuevoArticuloScreenState createState() => _NuevoArticuloScreenState();
}

class _NuevoArticuloScreenState extends State<NuevoArticuloScreen> {
  final TextEditingController nombreController = TextEditingController();
  final TextEditingController precioController = TextEditingController();
  final TextEditingController stockController = TextEditingController();

  // URL base de tu backend en Railway
  static const String baseUrl =
      "https://bdappbodega-backend-production.up.railway.app";

  Future<void> crearArticulo() async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/articulos"),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'descripcion': nombreController.text,
          'cantidad': int.parse(stockController.text),
          'precio': double.parse(precioController.text),
        }),
      );

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Artículo creado correctamente')),
        );
        Navigator.pop(context, true); // <- devuelve true para refrescar lista
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al crear artículo: ${response.statusCode}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Nuevo artículo")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: nombreController,
              decoration: const InputDecoration(labelText: "Nombre"),
            ),
            TextField(
              controller: precioController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: "Precio"),
            ),
            TextField(
              controller: stockController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: "Stock"),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: crearArticulo,
              child: const Text("Guardar"),
            ),
          ],
        ),
      ),
    );
  }
}