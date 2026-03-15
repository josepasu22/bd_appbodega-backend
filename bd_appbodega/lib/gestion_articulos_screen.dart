import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'articulo_detalle_screen.dart';
import 'nuevo_articulo_screen.dart';

class GestionArticulosScreen extends StatefulWidget {
  @override
  _GestionArticulosScreenState createState() => _GestionArticulosScreenState();
}

class _GestionArticulosScreenState extends State<GestionArticulosScreen> {
  List<dynamic> articulos = [];

  @override
  void initState() {
    super.initState();
    fetchArticulos();
  }

  Future<void> fetchArticulos() async {
    final response = await http.get(
      Uri.parse('http://192.168.1.120:3000/articulos'),
    );
    if (response.statusCode == 200) {
      setState(() {
        articulos = jsonDecode(response.body);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Gestión de artículos")),
      body: ListView.builder(
        itemCount: articulos.length,
        itemBuilder: (context, index) {
          final articulo = articulos[index];
          return ListTile(
            title: Text(articulo['descripcion']),
            subtitle: Text("Stock: ${articulo['cantidad']}"),
            onTap: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ArticuloDetalleScreen(articulo: articulo),
                ),
              );
              if (result == true) {
                fetchArticulos(); // refresca lista al volver
              }
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        child: const Icon(Icons.add),
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => NuevoArticuloScreen()),
          );
          if (result == true) {
            fetchArticulos(); // refresca lista al volver
          }
        },
      ),
    );
  }
}