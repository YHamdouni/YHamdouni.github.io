export const query = `
       query {
  user {
    id
    login
    firstName
    lastName
    email
    campus
    auditRatio
    totalUp
    totalDown
    finished_projects: groups(
      where: {group: {status: {_eq: finished}, _and: [{path: {_like: "%module%"}}, {path: {_nilike: "%piscine-js%"}}]}}
    ) {
      group {
        path
        members{
          userLogin
        }
      }
    }
    current_projects: groups(where: {group: {status: {_eq: working}}}) {
      group {
        path
        status
        members {
          userLogin
        }
      }
    }
    transactions_aggregate(where: {eventId: {_eq: 41}, type: {_eq: "xp"}}) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
    sklis: transaction(
      distinct_on: type 
      where: { type: { _like: "skill_%" } }
      order_by: [{ type: asc }, { amount: desc }]
    ) {
      type
      amount
    }
}

`