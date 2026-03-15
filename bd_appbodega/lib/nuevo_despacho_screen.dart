import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NuevoDespachoScreen extends StatefulWidget {
  const NuevoDespachoScreen({super.key}); // ✅ key agregado

  @override
  State<NuevoDespachoScreen> createState() => _NuevoDespachoScreenState();
}

class _NuevoDespachoScreenState extends State<NuevoDespachoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cantidadController = TextEditingController();

  List<dynamic> articulos = [];
  List<dynamic> colaboradores = [];
  dynamic articuloSeleccionado;
  dynamic colaboradorSeleccionado;
  bool cargando = true; // estado de carga
  String? errorMsg;     // mensaje de error

  @override
  void initState() {
    super.initState();
    cargarDatos();
  }

  Future<void> cargarDatos() async {
    try {
      final resArt = await http.get(Uri.parse("http://192.168.1.120:3000/articulos"));
      final resCol = await http.get(Uri.parse("http://192.168.1.120:3000/colaboradores"));

      debugPrint("Respuesta artículos: ${resArt.body}");
      debugPrint("Respuesta colaboradores: ${resCol.body}");

      if (resArt.statusCode == 200 && resCol.statusCode == 200) {
        setState(() {
          articulos = jsonDecode(resArt.body);
          colaboradores = jsonDecode(resCol.body);
          cargando = false;
        });
      } else {
        setState(() {
          cargando = false;
          errorMsg = "Error al cargar datos: ${resArt.statusCode}, ${resCol.statusCode}";
        });
      }
    } catch (e) {
      setState(() {
        cargando = false;
        errorMsg = "Error de conexión: $e";
      });
    }
  }

  Future<void> guardarDespacho() async {
    if (!_formKey.currentState!.validate()) return;

    if (articuloSeleccionado == null || colaboradorSeleccionado == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Selecciona artículo y colaborador")),
      );
      return;
    }

    DateTime hoy = DateTime.now();
    String fechaFormateada =
        "${hoy.year}-${hoy.month.toString().padLeft(2, '0')}-${hoy.day.toString().padLeft(2, '0')}";

    try {
      final response = await http.post(
        Uri.parse("http://192.168.1.120:3000/despachos"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "fecha": fechaFormateada,
          "colaboradorId": colaboradorSeleccionado["id"],
          "articuloId": articuloSeleccionado["id"],
          "cantidad": int.tryParse(_cantidadController.text) ?? 0,
        }),
      );

      debugPrint("Respuesta guardar despacho: ${response.body}");

      if (response.statusCode == 200 || response.statusCode == 201) {
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error al guardar despacho: ${response.statusCode}")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error de conexión: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Nuevo Despacho")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: cargando
              ? const Center(child: CircularProgressIndicator()) // loader mientras carga
              : errorMsg != null
                  ? Center(child: Text(errorMsg!)) // muestra error si falla
                  : Column(
                      children: [
                        DropdownButtonFormField<dynamic>(
                          initialValue: articuloSeleccionado,
                          items: articulos.map((a) {
                            return DropdownMenuItem(
                              value: a,
                              child: Text("${a['descripcion']} (Stock: ${a['cantidad']})"),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() {
                              articuloSeleccionado = val;
                            });
                          },
                          decoration: const InputDecoration(labelText: "Artículo"),
                        ),
                        DropdownButtonFormField<dynamic>(
                          initialValue: colaboradorSeleccionado,
                          items: colaboradores.map((c) {
                            return DropdownMenuItem(
                              value: c,
                              child: Text(c['nombre']),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setState(() {
                              colaboradorSeleccionado = val;
                            });
                          },
                          decoration: const InputDecoration(labelText: "Colaborador"),
                        ),
                        TextFormField(
                          controller: _cantidadController,
                          decoration: const InputDecoration(labelText: "Cantidad"),
                          keyboardType: TextInputType.number,
                          validator: (value) =>
                              value == null || value.isEmpty ? "Ingresa la cantidad" : null,
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: guardarDespacho,
                          child: const Text("Guardar"),
                        ),
                      ],
                    ),
        ),
      ),
    );
  }
}