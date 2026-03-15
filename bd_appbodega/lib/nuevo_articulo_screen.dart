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

  Future<void> crearArticulo() async {
    final response = await http.post(
      Uri.parse('http://192.168.1.120:3000/articulos'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'descripcion': nombreController.text,
        'cantidad': int.parse(stockController.text),
        'precio': double.parse(precioController.text),
      }),
    );

    if (response.statusCode == 200) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Artículo creado correctamente')),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al crear artículo')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Nuevo artículo")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(controller: nombreController, decoration: InputDecoration(labelText: "Nombre")),
            TextField(controller: precioController, decoration: InputDecoration(labelText: "Precio")),
            TextField(controller: stockController, decoration: InputDecoration(labelText: "Stock")),
            SizedBox(height: 20),
            ElevatedButton(onPressed: crearArticulo, child: Text("Guardar")),
          ],
        ),
      ),
    );
  }
}