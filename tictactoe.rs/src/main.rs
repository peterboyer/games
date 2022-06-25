use rand::Rng;
use std::collections::HashMap;
use std::io;
use std::io::Write;

#[derive(Clone, Copy, Debug, PartialEq)]
enum Player {
    X,
    O,
}

#[derive(Hash, Debug, Eq, PartialEq)]
struct Coord {
    x: usize,
    y: usize,
}

struct Game {
    player: Player,
    grid: HashMap<Coord, Player>,
    winner: Option<Player>,
}

struct GameOptions {
    initial_player: Option<Player>,
}

impl Default for GameOptions {
    fn default() -> Self {
        GameOptions {
            initial_player: None,
        }
    }
}

#[derive(Debug)]
enum GameError {
    CoordOccupied,
    GameOver,
}

impl Game {
    fn new() -> Self {
        Game::new_with(GameOptions::default())
    }

    fn new_with(options: GameOptions) -> Self {
        Game {
            player: options
                .initial_player
                .unwrap_or_else(|| match rand::thread_rng().gen() {
                    true => Player::X,
                    false => Player::O,
                }),
            grid: HashMap::new(),
            winner: None,
        }
    }

    fn draw(&self) {
        let grid = &self.grid;
        for y in 1..=3 {
            let mut row = String::new();
            row.push_str("|");
            for x in 1..=3 {
                let coord = Coord { x, y };
                let coord_player = grid.get(&coord);
                match coord_player {
                    Some(Player::X) => {
                        row.push_str("X|");
                    }
                    Some(Player::O) => {
                        row.push_str("O|");
                    }
                    None => {
                        row.push_str(" |");
                    }
                }
            }
            println!("{}", row)
        }
    }

    fn next(&mut self, coord: Coord) -> Result<(), GameError> {
        let winner = self.winner;
        if winner.is_some() {
            return Result::Err(GameError::GameOver);
        }

        match self.grid.get(&coord) {
            Some(_) => {
                return Result::Err(GameError::CoordOccupied);
            }
            _ => (),
        }

        self.grid.insert(coord, self.player);
        // solve rows
        for y in 1..=3 {
            let row_player = self.grid.get(&Coord { x: 1, y }).map(|&p| *&p);
            if row_player.is_none() {
                continue;
            }
            for x in 2..=3 {
                let cmp_player = self.grid.get(&Coord { x, y }).map(|&p| *&p);
                if cmp_player != row_player {
                    break
                }
                if x == 3 {
                    self.winner = row_player;
                }
            }
        }
        // solve cols
        for x in 1..=3 {
            let col_player = self.grid.get(&Coord { y: 1, x }).map(|&p| *&p);
            if col_player.is_none() {
                continue;
            }
            for y in 2..=3 {
                let cmp_player = self.grid.get(&Coord { x, y }).map(|&p| *&p);
                if cmp_player != col_player {
                    break
                }
                if y == 3 {
                    self.winner = col_player;
                }
            }
        }
        // solve diagonals
        // ((1,1), (2,2), (3,3))
        // ((3,1), (2,2), (1,3))
        let mut player: Option<Player> = None;
        for i in 1..=3 {
            let tmp_player = self.grid.get(&Coord { x: i, y: i }).map(|&p| *&p);
            if tmp_player.is_none() {
                break;
            }
            if i != 1 && player != tmp_player {
                break;
            }
            player = tmp_player;
            if i == 3 {
                self.winner = player;
            }
        }

        let mut player: Option<Player> = None;
        for i in 1..=3 {
            let tmp_player = self.grid.get(&Coord { x: 4 - i, y: i }).map(|&p| *&p);
            if tmp_player.is_none() {
                break;
            }
            if i != 1 && player != tmp_player {
                break;
            }
            player = tmp_player;
            if i == 3 {
                self.winner = player;
            }
        }

        if self.player == Player::X {
            self.player = Player::O;
        } else {
            self.player = Player::X;
        }

        return Result::Ok(());
    }
}

fn main() {
    let mut game = Game::new();

    loop {
        game.draw();
        println!("Current Player: {:?}", game.player);

        let mut input = String::new();
        print!("Enter a coordinate: ");
        io::stdout().flush().expect("Failed to flush.");

        io::stdin()
            .read_line(&mut input)
            .expect("Failed to read line.");

        let coordparts: Result<Vec<usize>, _> =
            input.trim().split(',').map(|n| n.parse()).collect();

        let (x, y) = match coordparts {
            Ok(v) if v.len() == 2 => (v[0], v[1]),
            _ => {
                println!("Invalid coordinate! Try again.");
                continue;
            }
        };

        let coord = Coord { x, y };
        match game.next(coord) {
            Err(GameError::CoordOccupied) => {
                println!("Coordinate already occupied! Try again.");
                continue;
            }
            Err(GameError::GameOver) => {
                println!("Game is already finished!");
                continue;
            }
            _ => (),
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::*;

    #[test]
    fn it_should_correctly_assign_player_to_cells() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 1, y: 1 }).unwrap();
        game.next(Coord { x: 1, y: 2 }).unwrap();
        game.next(Coord { x: 2, y: 1 }).unwrap();
        game.next(Coord { x: 2, y: 2 }).unwrap();
        assert!(game.grid.get(&Coord { x: 1, y: 1 }).unwrap() == &Player::X);
        assert!(game.grid.get(&Coord { x: 1, y: 2 }).unwrap() == &Player::O);
        assert!(game.grid.get(&Coord { x: 2, y: 1 }).unwrap() == &Player::X);
        assert!(game.grid.get(&Coord { x: 2, y: 2 }).unwrap() == &Player::O);
    }

    #[test]
    fn it_should_change_player_after_valid_turn() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 1, y: 1 }).unwrap();
        assert!(game.player == Player::O);
    }

    #[test]
    fn it_should_not_change_player_if_invalid_turn() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 1, y: 1 }).unwrap();
        assert!(game.next(Coord { x: 1, y: 1 }).is_err());
    }

    #[test]
    fn it_should_win_game_if_3_in_row_and_error_after() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 1, y: 1 }).unwrap();
        game.next(Coord { x: 1, y: 2 }).unwrap();
        game.next(Coord { x: 2, y: 1 }).unwrap();
        game.next(Coord { x: 2, y: 2 }).unwrap();
        game.next(Coord { x: 3, y: 1 }).unwrap();
        assert!(game.winner.unwrap() == Player::X);
        assert!(matches!(game.next(Coord { x: 1, y: 1 }), Result::Err(GameError::GameOver)));
    }

    #[test]
    fn it_should_win_game_if_3_in_col() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 2, y: 1 }).unwrap();
        game.next(Coord { x: 1, y: 1 }).unwrap();
        game.next(Coord { x: 2, y: 2 }).unwrap();
        game.next(Coord { x: 1, y: 2 }).unwrap();
        game.next(Coord { x: 2, y: 3 }).unwrap();
        assert!(game.winner.unwrap() == Player::X);
    }

    #[test]
    fn it_should_win_game_if_3_in_diag_1() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 1, y: 1 }).unwrap();
        game.next(Coord { x: 2, y: 1 }).unwrap();
        game.next(Coord { x: 2, y: 2 }).unwrap();
        game.next(Coord { x: 1, y: 2 }).unwrap();
        game.next(Coord { x: 3, y: 3 }).unwrap();
        assert!(game.winner.unwrap() == Player::X);
    }

    #[test]
    fn it_should_win_game_if_3_in_diag_2() {
        let mut game = Game::new_with(GameOptions {
            initial_player: Some(Player::X),
            ..Default::default()
        });
        game.next(Coord { x: 3, y: 1 }).unwrap();
        game.next(Coord { x: 2, y: 1 }).unwrap();
        game.next(Coord { x: 2, y: 2 }).unwrap();
        game.next(Coord { x: 1, y: 2 }).unwrap();
        game.next(Coord { x: 1, y: 3 }).unwrap();
        assert!(game.winner.unwrap() == Player::X);
    }
}
