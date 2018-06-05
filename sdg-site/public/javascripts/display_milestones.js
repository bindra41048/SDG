function displayMilestones(milestones) {

  var ctx = document.getElementById("myChart").getContext('2d');
  ctx.scale(0.5, 0.5);

  var current_year = 2018;

  var years = [];
  var historical_targets = [];
  var future_targets = [];



  for (var i = 0; i < milestones.length; i++) {
    years.push(Number(milestones[i].year));
    if (milestones[i].year > current_year) {
      historical_targets.push(null);
    } else {
      historical_targets.push(Number(milestones[i].value)); 
    }
     future_targets.push(Number(milestones[i].value));

  }


  


  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: years,
          datasets: [
          {
              label: 'Targets',
              data: future_targets,
              fill: false,
              lineTension: 0,
              borderDash: [10,5],
              borderColor: "green",
          },
          {
              label: 'Historical Targets',
              data: historical_targets,
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
