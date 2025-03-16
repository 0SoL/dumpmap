document.addEventListener("DOMContentLoaded", function() {
    // Создаем canvas-рендерер для оптимизации
    const canvasRenderer = L.canvas({ padding: 0.5 });
    
    // Инициализация карты с использованием canvas-рендерера
    const map = L.map('map', {
        zoomSnap: 0.2,
        zoomDelta: 0.2,
        renderer: canvasRenderer
    }).setView([48.0, 68.0], 6);

    const baseTileUrl = "https://tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png";
    L.tileLayer(
        `${baseTileUrl}?apikey=${API_KEY}`,
        {
            attribution: '&copy; OpenStreetMap contributors &copy; Thunderforest',
            maxZoom: 19,
        }
    ).addTo(map);

    // Автоматическое обновление размеров карты
    const mapContainer = document.getElementById('map');
    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(mapContainer);
    } else {
        window.addEventListener('resize', () => {
            map.invalidateSize();
        });
    }

    // Загрузка GeoJSON и добавление объектов на карту
    fetch('static/new_map.geojson')
      .then(response => response.json())
      .then(geojsonData => {
        // Собираем уникальные значения свойства "way"
        const routesSet = new Set();
        geojsonData.features.forEach(feature => {
            if (feature.properties && feature.properties.way) {
                routesSet.add(feature.properties.way);
            }
        });
        const routesArray = Array.from(routesSet);
        
        // Функция для генерации отличительного цвета по индексу
        function generateDistinctColor(index, total) {
            const hue = Math.round((360 / total) * index);
            return `hsl(${hue}, 70%, 50%)`;
        }
        
        // Создаем словарь цветов для каждого пути
        const routeColors = {};
        routesArray.forEach((route, index) => {
            routeColors[route] = generateDistinctColor(index, routesArray.length);
        });
        
        L.geoJSON(geojsonData, {
          renderer: canvasRenderer,
          // Используем стандартные маркеры для станций (объекты типа Point)
          pointToLayer: function(feature, latlng) {
            return L.marker(latlng);
          },
          // Для линий задаем стиль с уникальным цветом для каждого пути
          style: function(feature) {
            if (feature.geometry.type === 'LineString') {
              let route = feature.properties.way;
              let color = routeColors[route] || 'black';
              return { color: color, weight: 3 };
            }
          },
          // Привязка pop-up ко всем объектам с заменой ключей на нужные подписи
          onEachFeature: function(feature, layer) {
            if (feature.properties) {
              const keyMapping = {
                "name": "название",
                "volume": "Объем",
                "way": "Путь",
                "type": "Тип рельс, шпал",
                "bal-st": "бал-ст"
              };

              let popupContent = "<table style='width:100%;'>";
              for (let key in feature.properties) {
                if (feature.properties.hasOwnProperty(key)) {
                  let label = keyMapping[key] || key;
                  popupContent += `<tr><td><strong>${label}</strong></td><td>${feature.properties[key]}</td></tr>`;
                }
              }
              popupContent += "</table>";
              layer.bindPopup(popupContent);
            }
          }
        }).addTo(map);
      })
      .catch(error => console.error('Ошибка при загрузке GeoJSON:', error));
});