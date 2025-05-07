document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById("lineChart").getContext("2d");

    const labels = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho"];
    const data = {
        labels: labels,
        datasets: [{
            label: 'Receita Mensal',
            data: [65, 59, 80, 81, 56, 55, 40],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const config = {
        type: 'line',
        data: data,
    };

    new Chart(ctx, config);
});
