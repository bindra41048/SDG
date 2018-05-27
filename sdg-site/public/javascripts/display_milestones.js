function displayMilestones(milestones) {

  var ctx = document.getElementById("myChart").getContext('2d');
  var years = [];
  var targets = [];
  for (var i = 0; i < milestones.length; i++) {
    years.push(Number(milestones[i].year));
    targets.push(Number(milestones[i].value));
  }
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: years,
          datasets: [{
              label: 'Compact Targets',
              data: targets,
              fill: false,
              borderColor: "green",
          }]
      },
      options: {
          scales: {
          }
      }
  });
}
